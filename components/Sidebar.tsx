'use client'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-client'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  onNewSession: () => void
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string
  user?: any // Add user prop
}

export default function Sidebar({ 
  isCollapsed, 
  onToggle, 
  onNewSession, 
  onSelectSession, 
  currentSessionId,
  user 
}: SidebarProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mock data for research sessions - in a real app this would come from your database
  const researchSessions = [
    {
      id: '1',
      title: 'Machine Learning in Healthcare',
      description: 'Found 47 papers on ML applications in medical diagnosis',
      timestamp: '2:34 PM',
      date: 'TODAY'
    },
    {
      id: '2',
      title: 'Climate Change Impact Studies',
      description: 'Searching for recent publications on climate modeling',
      timestamp: '11:22 AM',
      date: 'TODAY'
    },
    {
      id: '3',
      title: 'Quantum Computing Algorithms',
      description: 'Reviewed 23 papers on quantum algorithm optimization',
      timestamp: 'Yesterday',
      date: 'YESTERDAY'
    },
    {
      id: '4',
      title: 'Neural Network Architecture',
      description: 'Comparative analysis of CNN vs Transformer models',
      timestamp: 'Yesterday',
      date: 'YESTERDAY'
    }
  ]

  const groupedSessions = researchSessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = []
    }
    acc[session.date].push(session)
    return acc
  }, {} as Record<string, typeof researchSessions>)

  if (isCollapsed) {
    return (
      <div className="w-20 glass-strong border-r border-glass-200 flex flex-col items-center py-6 relative z-10">
        <button
          onClick={onToggle}
          className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mt-8 space-y-4">
          <button
            onClick={onNewSession}
            className="glass-strong p-3 text-white rounded-xl hover:neon-glow transition-all duration-300 group"
            title="New Research Session"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
            title="Sign Out"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 glass-strong border-r border-glass-200 flex flex-col h-full relative z-10">
      {/* Header */}
      <div className="p-6 border-b border-glass-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient-neon">Rastro</h1>
          <button
            onClick={onToggle}
            className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <p className="text-glass-300 font-sf-mono text-sm tracking-wider mt-2">
          REVOLUTIONARY RESEARCH
        </p>
      </div>

      {/* New Research Session Button */}
      <div className="p-6">
        <button
          onClick={onNewSession}
          className="w-full glass-strong text-white py-4 px-6 rounded-2xl hover:neon-glow transition-all duration-300 flex items-center justify-center space-x-3 font-sf-mono tracking-wider"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>NEW SESSION</span>
        </button>
      </div>

      {/* Research Sessions History */}
      <div className="flex-1 overflow-y-auto px-6">
        {Object.entries(groupedSessions).map(([date, sessions]) => (
          <div key={date} className="mb-8">
            <h3 className="text-xs font-bold text-glass-400 uppercase tracking-widest mb-4 font-sf-mono">
              {date}
            </h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                    currentSessionId === session.id
                      ? 'glass-strong text-white border border-glass-200 neon-glow'
                      : 'glass text-glass-300 hover:text-white hover:neon-glow border border-transparent hover:border-glass-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate mb-2">
                        {session.title}
                      </h4>
                      <p className="text-xs text-glass-300 line-clamp-2 font-sf-mono tracking-wide">
                        {session.description}
                      </p>
                    </div>
                    <span className="text-xs text-glass-400 ml-3 flex-shrink-0 font-sf-mono">
                      {session.timestamp}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile and Logout */}
      <div className="p-6 border-t border-glass-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-gradient-futuristic text-white rounded-2xl flex items-center justify-center text-sm font-bold shadow-neon">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-glass-300 font-sf-mono tracking-wider">PREMIUM PLAN</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left p-3 text-glass-300 hover:text-white hover:neon-glow rounded-xl transition-all duration-300 flex items-center space-x-3 glass hover:glass-strong"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-sf-mono tracking-wider">SIGN OUT</span>
        </button>
      </div>
    </div>
  )
}
