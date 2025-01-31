import { createClient } from '@/utils/supabase/server';
import { Database } from './types';
import { Chat, Message, Document, Suggestion } from './schema';

// Chat related queries
export async function getChatById(params: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chats')
    .select()
    .eq('id', params.id)
    .single();
  return data;
}

export async function getChatsByUserId(params: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chats')
    .select()
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function saveChat(params: { id: string; userId: string; title: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chats')
    .insert({ id: params.id, user_id: params.userId, title: params.title })
    .select()
    .single();
  return data;
}

export async function updateChatVisiblityById(params: { id: string; visibility: 'public' | 'private' }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('chats')
    .update({ visibility: params.visibility })
    .eq('id', params.id)
    .select()
    .single();
  return data;
}

export async function deleteChatById(params: { id: string }) {
  const supabase = await createClient();
  await supabase.from('chats').delete().eq('id', params.id);
}

// Message related queries
export async function getMessageById(params: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select()
    .eq('id', params.id)
    .single();
  return data;
}

export async function getMessagesByChatId(params: { chatId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select()
    .eq('chat_id', params.chatId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function saveMessages(params: { messages: Array<Partial<Message>> }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .insert(params.messages)
    .select();
  return data ?? [];
}

export async function deleteMessagesByChatIdAfterTimestamp(params: { chatId: string; timestamp: string }) {
  const supabase = await createClient();
  await supabase
    .from('messages')
    .delete()
    .eq('chat_id', params.chatId)
    .gte('created_at', params.timestamp);
}

// Document related queries
export async function getDocumentById(params: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select()
    .eq('id', params.id)
    .single();
  return data;
}

export async function getDocumentsById(params: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select()
    .eq('id', params.id);
  return data ?? [];
}

export async function deleteDocumentsByIdAfterTimestamp(params: { id: string; timestamp: Date }) {
  const supabase = await createClient();
  await supabase
    .from('documents')
    .delete()
    .eq('id', params.id)
    .gte('created_at', params.timestamp.toISOString());
}

export async function saveDocument(params: { 
  id: string;
  title: string; 
  content?: string; 
  userId: string; 
  kind?: 'text' | 'code' | 'image' 
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .insert({ 
      id: params.id,
      title: params.title, 
      content: params.content, 
      user_id: params.userId, 
      kind: params.kind ?? 'text' 
    })
    .select()
    .single();
  return data;
}

export async function updateDocument(params: { id: string; content: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .update({ content: params.content })
    .eq('id', params.id)
    .select()
    .single();
  return data;
}

// Suggestion related queries
export async function getSuggestionsByDocumentId(params: { documentId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('suggestions')
    .select()
    .eq('document_id', params.documentId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function saveSuggestion(params: Partial<Suggestion> | Array<Partial<Suggestion>>) {
  const supabase = await createClient();
  if (Array.isArray(params)) {
    const { data } = await supabase
      .from('suggestions')
      .insert(params)
      .select();
    return data ?? [];
  } else {
    const { data } = await supabase
      .from('suggestions')
      .insert(params)
      .select()
      .single();
    return data;
  }
}

export async function updateSuggestionStatus(params: { id: string; status: 'accepted' | 'rejected' }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('suggestions')
    .update({ status: params.status })
    .eq('id', params.id)
    .select()
    .single();
  return data;
}

// Vote related queries
export async function getVotesByChatId(params: { chatId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('votes')
    .select()
    .eq('chat_id', params.chatId);
  return data ?? [];
}

export async function voteMessage(params: { messageId: string; userId: string; value: number }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('votes')
    .upsert({
      message_id: params.messageId,
      user_id: params.userId,
      value: params.value
    })
    .select()
    .single();
  return data;
}

export async function getMessagesByDocumentId({ documentId }: { documentId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select()
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });
  return data ?? [];
} 