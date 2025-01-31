'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function UserMenu({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative ml-3">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-gray-700">
          {user.user_metadata.full_name || user.email}
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </div>
  )
} 