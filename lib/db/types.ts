export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          title: string
          user_id: string
          visibility: 'public' | 'private'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          visibility?: 'public' | 'private'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          visibility?: 'public' | 'private'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: Json
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string | null
          user_id: string
          type: 'text' | 'code' | 'image'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          user_id: string
          type?: 'text' | 'code' | 'image'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          user_id?: string
          type?: 'text' | 'code' | 'image'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          document_id: string
          user_id: string
          original_text: string
          suggested_text: string
          description: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          original_text: string
          suggested_text: string
          description?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          original_text?: string
          suggested_text?: string
          description?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 