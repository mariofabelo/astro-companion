'use client'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-client'

export default function Header() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Astro Research Companion</h1>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
