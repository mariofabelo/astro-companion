'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-client'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    const sb = createSupabaseBrowser()
    
    // Check current session
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
      } else {
        setReady(true)
      }
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login')
      } else {
        setReady(true)
      }
      setLoading(false)
    })
    
    return () => subscription.unsubscribe()
  }, [router])
  
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!ready) {
    return null
  }
  
  return <>{children}</>
}
