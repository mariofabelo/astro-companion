import LaTeXText from './LaTeXText';

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp?: string
  papers?: Array<{
    title: string
    authors: string
    snippet: string
    citations: number
    published: string
    journal: string
  }>
}

export default function ChatMessage({ message, isUser, timestamp, papers }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-4 max-w-5xl`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-futuristic text-white shadow-neon' 
            : 'glass-strong text-neon-400 neon-glow'
        }`}>
          {isUser ? (
            <span className="text-lg font-bold font-sf">M</span>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block p-6 rounded-3xl ${
            isUser 
              ? 'glass-strong text-white border border-glass-200 shadow-glass-lg' 
              : 'glass text-white border border-glass-200'
          }`}>
            <p className="text-base leading-relaxed font-sf">{message}</p>
          </div>
          
          {/* Papers Results */}
          {papers && papers.length > 0 && (
            <div className="mt-6 space-y-4">
              {papers.map((paper, index) => (
                <div key={index} className="glass-strong border border-glass-200 rounded-2xl p-6 shadow-glass-lg hover:neon-glow transition-all duration-300 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <LaTeXText 
                        text={paper.title}
                        as="h4"
                        className="text-lg font-bold text-white mb-2 group-hover:text-gradient-neon transition-all duration-300"
                      />
                      <p className="text-sm text-glass-300 mb-3 font-sf-mono tracking-wider">
                        {paper.authors}
                      </p>
                      <LaTeXText 
                        text={paper.snippet}
                        as="p"
                        className="text-base text-glass-200 mb-4 leading-relaxed"
                      />
                      <div className="flex items-center space-x-6 text-sm text-glass-300 font-sf-mono">
                        <span className="flex items-center space-x-2">
                          <span className="text-neon-400">📊</span>
                          <span>{paper.citations} citations</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <span className="text-neon-400">📅</span>
                          <span>{paper.published}</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <span className="text-neon-400">📚</span>
                          <span>{paper.journal}</span>
                        </span>
                      </div>
                    </div>
                    <button className="ml-6 glass p-3 rounded-xl text-glass-300 hover:text-white hover:neon-glow transition-all duration-300 group-hover:scale-110">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="glass text-center p-4 rounded-2xl border border-glass-200">
                <p className="text-sm text-glass-300 font-sf-mono tracking-wider">
                  Showing {papers.length} of 47 results
                </p>
                <button className="mt-2 text-neon-400 hover:text-white font-medium font-sf-mono tracking-wider transition-colors duration-300">
                  VIEW ALL RESULTS →
                </button>
              </div>
            </div>
          )}
          
          {timestamp && (
            <p className={`text-xs text-glass-400 mt-3 font-sf-mono tracking-wider ${isUser ? 'text-right' : 'text-left'}`}>
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
