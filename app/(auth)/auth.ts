import { createClient } from '@/utils/supabase/server';

export async function auth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getAuthUser() {
  return auth();
} 