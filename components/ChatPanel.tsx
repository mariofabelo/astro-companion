'use client'
import { useState } from 'react'

interface ChatPanelProps {
  paperIds?: string[]
  className?: string
}

export default function ChatPanel({ paperIds, className = '' }: ChatPanelProps) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAsk = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          paperIds: paperIds || null
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get answer')
      }
      
      const data = await response.json()
      setAnswer(data.answer || 'No answer received')
    } catch (err) {
      console.error('Chat error:', err)
      setError('Failed to get answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label htmlFor="query" className="block text-sm font-medium text-gray-700">
          Ask about your papers
        </label>
        <div className="flex space-x-2">
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What would you like to know about this paper?"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Asking...
              </div>
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {answer && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Answer:</h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-900">{answer}</p>
          </div>
        </div>
      )}

      {!paperIds && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-yellow-700 text-sm">
            No papers selected. The answer will be based on all your papers.
          </p>
        </div>
      )}
    </div>
  )
}
