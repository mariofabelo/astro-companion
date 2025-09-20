'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-client'
import EnvChecker from '@/components/EnvChecker'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Debug: Log environment variables (first 20 chars of key for security)
      console.log('Debug - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Debug - Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      console.log('Debug - Current origin:', window.location.origin)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('OAuth error:', error)
        setError(error.message)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden font-sf">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-indigo-400/10 rounded-full blur-3xl animate-float"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Research
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                The All-in-One for
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Astrophysics</span>
                <br />
                Research
              </h1>
              
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* arXiv & ADS */}
                <div className="group relative overflow-hidden bg-transparent backdrop-blur-3xl border border-white/30 rounded-3xl p-4 hover:border-white/40 hover:backdrop-blur-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] shadow-xl shadow-black/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/2 opacity-50 group-hover:opacity-70 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/4 transition-all duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 via-white/10 to-white/5 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/8 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <img src="/arxiv-logo.png" alt="arXiv" className="h-5 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                      <img src="/ads-logo.png" alt="ADS" className="h-7 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-slate-800 font-semibold text-center">Search Papers</p>
                    <p className="text-xs text-slate-600 text-center mt-1">Find research instantly</p>
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="group relative overflow-hidden bg-transparent backdrop-blur-3xl border border-white/30 rounded-3xl p-4 hover:border-white/40 hover:backdrop-blur-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] shadow-xl shadow-black/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/2 opacity-50 group-hover:opacity-70 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/4 transition-all duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 via-white/10 to-white/5 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/8 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-2 bg-white/50 backdrop-blur-md rounded-xl group-hover:bg-white/70 group-hover:backdrop-blur-lg transition-all border border-white/40 group-hover:border-white/60 shadow-sm group-hover:shadow-md">
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold text-center">Upload PDFs</p>
                    <p className="text-xs text-slate-600 text-center mt-1">Your own research</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="group relative overflow-hidden bg-transparent backdrop-blur-3xl border border-white/30 rounded-3xl p-4 hover:border-white/40 hover:backdrop-blur-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] shadow-xl shadow-black/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/2 opacity-50 group-hover:opacity-70 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/4 transition-all duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 via-white/10 to-white/5 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/8 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-2 bg-white/50 backdrop-blur-md rounded-xl group-hover:bg-white/70 group-hover:backdrop-blur-lg transition-all border border-white/40 group-hover:border-white/60 shadow-sm group-hover:shadow-md">
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold text-center">AI Analysis</p>
                    <p className="text-xs text-slate-600 text-center mt-1">Smart insights</p>
                  </div>
                </div>

                {/* Stay Current */}
                <div className="group relative overflow-hidden bg-transparent backdrop-blur-3xl border border-white/30 rounded-3xl p-4 hover:border-white/40 hover:backdrop-blur-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] shadow-xl shadow-black/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/2 opacity-50 group-hover:opacity-70 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/4 transition-all duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-white/20 via-white/10 to-white/5 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 group-hover:from-white/25 group-hover:via-white/15 group-hover:to-white/8 transition-all duration-300"></div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-2 bg-white/50 backdrop-blur-md rounded-xl group-hover:bg-white/70 group-hover:backdrop-blur-lg transition-all border border-white/40 group-hover:border-white/60 shadow-sm group-hover:shadow-md">
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold text-center">Stay Current</p>
                    <p className="text-xs text-slate-600 text-center mt-1">Latest updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="glass-strong bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 animate-scale-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Rastro</h2>
                  <p className="text-slate-600">Sign in to start your research journey</p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-blue-500"></div>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span className="font-semibold text-base">
                    {loading ? 'Signing in...' : 'Continue with Google'}
                  </span>
                </button>
                
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-up">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <EnvChecker />
    </div>
  )
}
