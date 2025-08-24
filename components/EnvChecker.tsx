'use client'
import { useState } from 'react'

export default function EnvChecker() {
  const [showDebug, setShowDebug] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 max-w-md">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="space-y-1 text-xs">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
              <div className="text-gray-600 break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}
              </div>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
              <div className="text-gray-600 break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
                  : '❌ Not set'}
              </div>
            </div>
            <div>
              <strong>NODE_ENV:</strong>
              <div className="text-gray-600">{process.env.NODE_ENV}</div>
            </div>
            <div>
              <strong>Current Origin:</strong>
              <div className="text-gray-600">{typeof window !== 'undefined' ? window.location.origin : 'SSR'}</div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-gray-500">
              This debug info only shows in development mode.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
