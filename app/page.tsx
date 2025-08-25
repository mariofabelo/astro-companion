'use client'
import { useState } from 'react'
import AuthGate from '@/components/AuthGate'
import Sidebar from '@/components/Sidebar'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import UniverseBackground from '@/components/UniverseBackground'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  papers?: Array<{
    title: string
    authors: string
    snippet: string
    citations: number
    published: string
    journal: string
  }>
}

export default function ResearchAssistant() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [selectedMode, setSelectedMode] = useState<'research' | 'upload'>('research')

  const handleNewSession = () => {
    setCurrentSessionId(undefined)
    setMessages([])
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // In a real app, you would load the session messages from your database
    // For now, we'll simulate loading a session
    if (sessionId === '1') {
      setMessages([
        {
          id: '1',
          content: "Hello! I'm your research assistant. I can help you search for academic papers, summarize research findings, and provide insights on various topics. What would you like to research today?",
          isUser: false,
          timestamp: '2:34 PM'
        },
        {
          id: '2',
          content: "I need to find recent papers on machine learning applications in medical diagnosis, particularly focusing on image analysis and deep learning techniques.",
          isUser: true,
          timestamp: '2:35 PM'
        },
        {
          id: '3',
          content: "I found 47 relevant papers on machine learning in medical diagnosis. Here are the most recent and highly-cited ones:",
          isUser: false,
          timestamp: '2:36 PM',
          papers: [
            {
              title: "Deep Learning for Medical Image Analysis: A Comprehensive Review",
              authors: "Zhang, L., Smith, J., Chen, W.",
              snippet: "This paper provides a comprehensive overview of deep learning techniques applied to medical image analysis, including CNN architectures, transfer learning, and data augmentation strategies...",
              citations: 234,
              published: "Jan 2024",
              journal: "Nature Medicine"
            },
            {
              title: "Transformer-Based Models for Medical Image Segmentation",
              authors: "Kumar, A., Johnson, M., Liu, X.",
              snippet: "Novel application of Vision Transformers to medical image segmentation tasks, demonstrating superior performance over traditional CNN approaches in radiological imaging...",
              citations: 156,
              published: "Nov 2023",
              journal: "IEEE TMI"
            },
            {
              title: "Federated Learning in Healthcare: Privacy-Preserving Medical AI",
              authors: "Brown, R., Davis, S., Wilson, K.",
              snippet: "Explores federated learning approaches for training medical AI models while maintaining patient privacy, with applications in diagnostic imaging across multiple healthcare institutions...",
              citations: 89,
              published: "Mar 2024",
              journal: "JMIR"
            }
          ]
        }
      ])
    }
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm processing your request. Let me search for relevant academic papers and provide you with the most up-to-date research findings.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      handleSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // If there are messages, show the chat interface
  if (messages.length > 0) {
    return (
      <AuthGate>
        <div className="h-screen flex relative overflow-hidden">
          {/* Dynamic Universe Background */}
          <UniverseBackground />

          {/* Sidebar */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onNewSession={handleNewSession}
            onSelectSession={handleSelectSession}
            currentSessionId={currentSessionId}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col relative z-10">
            {/* Top Bar */}
            <div className="glass-strong border-b border-glass-200 px-8 py-6 flex items-center justify-between">
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-gradient-neon mb-1">
                  {currentSessionId ? 'Machine Learning in Healthcare' : 'New Research Session'}
                </h1>
                <p className="text-glass-300 font-sf-mono text-sm tracking-wider">
                  REVOLUTIONARY AI RESEARCH COMPANION
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                </button>
                <button className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button className="glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto space-y-6">
                {messages.map((message, index) => (
                  <div key={message.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ChatMessage
                      message={message.content}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                      papers={message.papers}
                    />
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-6 animate-fade-in">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 glass rounded-2xl flex items-center justify-center neon-glow">
                        <svg className="w-6 h-6 text-neon-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="glass-strong text-white p-6 rounded-2xl max-w-2xl">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-neon-500 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-3 h-3 bg-neon-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <p className="text-glass-200 mt-3 font-sf-mono text-sm">Processing your request...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed right-8 bottom-32 flex flex-col space-y-4 z-20">
            <button className="glass-strong w-14 h-14 rounded-2xl shadow-glass-lg flex items-center justify-center text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="glass-strong w-14 h-14 rounded-2xl shadow-glass-lg flex items-center justify-center text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="w-14 h-14 bg-gradient-futuristic text-white rounded-2xl shadow-neon-lg flex items-center justify-center hover:shadow-neon transition-all duration-300 group animate-glow">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </AuthGate>
    )
  }

  // New chat interface - Revolutionary design
  return (
    <AuthGate>
      <div className="h-screen flex relative overflow-hidden">
        {/* Dynamic Universe Background */}
        <UniverseBackground />

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          <div className="max-w-4xl w-full animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gradient-neon mb-8 tracking-tight">
                Hi Mario Fabelo Ozcáriz. Ready to Research?
              </h1>
            </div>

            {/* Main Input Section */}
            <div className="glass-strong rounded-3xl p-8 border border-glass-200 shadow-glass-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about research, papers, or knowledge discovery..."
                    className="w-full resize-none bg-transparent border-none outline-none text-white placeholder-glass-300 text-xl font-sf leading-relaxed focus:outline-none"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
                
                {/* Mode Selection Buttons */}
                <div className="flex items-center justify-between pt-6">
                  {/* Left side - Mode buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('research')}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 font-sf-mono text-sm tracking-wider ${
                        selectedMode === 'research' 
                          ? 'glass-strong text-white neon-glow' 
                          : 'glass text-glass-300 hover:text-white hover:neon-glow'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>RESEARCH PAPERS</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedMode('upload')}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 font-sf-mono text-sm tracking-wider ${
                        selectedMode === 'upload' 
                          ? 'glass-strong text-white neon-glow' 
                          : 'glass text-glass-300 hover:text-white hover:neon-glow'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>UPLOAD PAPERS</span>
                    </button>
                  </div>

                  {/* Right side - Submit button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="glass-strong p-4 text-white rounded-xl hover:neon-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                  >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
