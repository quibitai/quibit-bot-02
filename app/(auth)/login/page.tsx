import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/chat');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4">
        <form
          className="flex flex-col gap-4"
          action="/auth/sign-in"
          method="post"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-2 rounded-md border bg-background"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="w-full px-4 py-2 rounded-md border bg-background"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <button className="w-full px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors">
            Sign In
          </button>
          <button
            formAction="/auth/sign-up"
            className="w-full px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
} 