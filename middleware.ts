import { createClient } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    // Auth condition
    if (!user) {
      // If the user is not authenticated and trying to access a protected route
      if (
        request.nextUrl.pathname.startsWith('/chat') ||
        request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname === '/'
      ) {
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } else {
      // If the user is authenticated and trying to access auth pages
      if (
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register')
      ) {
        const redirectUrl = new URL('/chat', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  } catch (error) {
    // On error, redirect to login
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
