import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

export async function auth(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function getAuthUser(): Promise<User | null> {
  return auth();
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await createClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
} 