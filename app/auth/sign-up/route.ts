import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Could not create user`,
      {
        status: 301,
      }
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/login?message=Check your email to continue sign in process`,
    {
      status: 301,
    }
  );
} 