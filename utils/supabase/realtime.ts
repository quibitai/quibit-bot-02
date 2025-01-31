import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from './client'
import { Database } from '@/lib/db/types'

type Table = keyof Database['public']['Tables']
type Row<T extends Table> = Database['public']['Tables'][T]['Row']

export function createRealtimeChannel(channelName: string) {
  const supabase = createClient()
  return supabase.channel(channelName)
}

export function subscribeToMessages(
  channelName: string,
  chatId: string,
  onMessage: (payload: { new: Row<'messages'> }) => void
): RealtimeChannel {
  return createRealtimeChannel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      onMessage
    )
    .subscribe()
}

export function subscribeToDocumentChanges(
  channelName: string,
  documentId: string,
  onUpdate: (payload: { new: Row<'documents'> }) => void
): RealtimeChannel {
  return createRealtimeChannel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`,
      },
      onUpdate
    )
    .subscribe()
}

export function subscribeToSuggestions(
  channelName: string,
  documentId: string,
  onSuggestion: (payload: { new: Row<'suggestions'> }) => void
): RealtimeChannel {
  return createRealtimeChannel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suggestions',
        filter: `document_id=eq.${documentId}`,
      },
      onSuggestion
    )
    .subscribe()
}

export function unsubscribe(channel: RealtimeChannel) {
  const supabase = createClient()
  supabase.removeChannel(channel)
} 