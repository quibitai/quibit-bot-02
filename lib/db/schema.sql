-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('text', 'code', 'image')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (message_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (
    auth.uid() = user_id OR
    visibility = 'public'
  );

CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from accessible chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.visibility = 'public')
    )
  );

CREATE POLICY "Users can insert messages to own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Suggestions policies
CREATE POLICY "Users can view suggestions for accessible documents" ON public.suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = suggestions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create suggestions" ON public.suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Users can read votes" ON public.votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own votes" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON public.votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_document_id ON public.suggestions(document_id);

-- Enable Realtime for specific tables
BEGIN;
  -- Drop existing publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create new publication for realtime
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    messages,
    chats,
    documents,
    suggestions;
COMMIT; 