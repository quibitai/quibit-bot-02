import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  const refreshToken = cookieStore.get('my-refresh-token')?.value

  if (!refreshToken) {
    return new Response('No refresh token found', { status: 401 })
  }

  await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  return new Response('Auth refresh completed', {
    status: 200,
  })
} 
