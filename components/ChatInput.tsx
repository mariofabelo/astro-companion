'use client'
import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, placeholder = "Ask me to search for papers, summarize research, or analyze findings...", disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className="glass-strong border-t border-glass-200 p-6 relative z-10">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        <div className="flex items-end space-x-4">
          {/* Voice Input */}
          <button
            type="button"
            className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
            title="Voice input"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Filter */}
          <button
            type="button"
            className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
            title="Advanced filters"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          {/* Main Input */}
          <div className="flex-1 relative">
            <div className="glass-strong border border-glass-200 rounded-2xl p-4 shadow-glass-lg">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full resize-none bg-transparent border-none outline-none text-white placeholder-glass-300 text-base font-sf leading-relaxed focus-neon disabled:opacity-50"
                rows={1}
                maxLength={2000}
              />
            </div>
            <div className="absolute bottom-4 right-4 flex items-center space-x-3">
              {/* Attachment */}
              <button
                type="button"
                className="glass p-2 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group"
                title="Attach files"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!message.trim() || disabled}
                className="glass-strong p-3 text-white rounded-xl hover:neon-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                title="Send message"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-glass-400 text-center font-sf-mono tracking-wider">
          PRESS ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
        </div>
      </form>
    </div>
  )
}
