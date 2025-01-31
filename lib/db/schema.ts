import { Database } from './types';

// Re-export base types
export type Chat = Database['public']['Tables']['chats']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Suggestion = Database['public']['Tables']['suggestions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Additional types
export type Vote = {
  id: string;
  message_id: string;
  user_id: string;
  value: number;
  created_at: string;
  updated_at: string;
};

// Message role types
export type MessageRole = Message['role'];
export type MessageContent = Message['content'];

// Document types
export type DocumentType = Document['type'];

// Suggestion status types
export type SuggestionStatus = Suggestion['status'];

// Visibility types
export type ChatVisibility = Chat['visibility']; 