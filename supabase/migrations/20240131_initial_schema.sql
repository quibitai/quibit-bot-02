-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'code', 'image')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chats"
    ON public.chats FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats"
    ON public.chats FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    TO authenticated
    USING (chat_id IN (
        SELECT id FROM public.chats WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create messages in their chats"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (chat_id IN (
        SELECT id FROM public.chats WHERE user_id = auth.uid()
    ));

-- Documents policies
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own documents"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Suggestions policies
CREATE POLICY "Users can view suggestions on their documents"
    ON public.suggestions FOR SELECT
    TO authenticated
    USING (document_id IN (
        SELECT id FROM public.documents WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create suggestions"
    ON public.suggestions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Votes policies
CREATE POLICY "Users can view votes"
    ON public.votes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can vote once per message"
    ON public.votes FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        message_id IN (
            SELECT id FROM public.messages WHERE chat_id IN (
                SELECT id FROM public.chats WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own votes"
    ON public.votes FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_document_id ON public.suggestions(document_id);
CREATE INDEX IF NOT EXISTS idx_votes_message_id ON public.votes(message_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id); 