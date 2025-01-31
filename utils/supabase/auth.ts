import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getUser() {
  const supabase = await createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signOut() {
  const supabase = await createClient()
  return await supabase.auth.signOut()
}

export async function getSession() {
  const supabase = await createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
} 