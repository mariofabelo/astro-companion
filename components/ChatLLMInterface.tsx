'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Paper, Source } from '@/types/paper';
import CanvasNode from './CanvasNode';
import LaTeXText from './LaTeXText';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatLLMInterfaceProps {
  onAddToSession: (papers: Paper[]) => void;
  currentSessionPapers: Paper[];
  externalInput?: string;
  onInputProcessed?: () => void;
  selectedSources: Source[];
  maxResults: 2 | 3 | 5 | 10;
  onSourceToggle: (source: Source) => void;
  onMaxResultsChange: (maxResults: 2 | 3 | 5 | 10) => void;
  showSourceDropdown: boolean;
  showResultsDropdown: boolean;
  onShowSourceDropdownToggle: () => void;
  onShowResultsDropdownToggle: () => void;
}

// API function for search
const searchPapers = async (query: string, maxResults: 2 | 3 | 5 | 10, sources: Source[]) => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, maxResults, sources }),
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
};

// API function for chat
const chatWithPapers = async (query: string, paperIds?: string[]) => {
  const response = await fetch('/api/rag/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query.trim(),
      paperIds: paperIds || null
    })
  });

  if (!response.ok) {
    throw new Error('Chat failed');
  }

  return response.json();
};

export default function ChatLLMInterface({ 
  onAddToSession, 
  currentSessionPapers, 
  externalInput, 
  onInputProcessed,
  selectedSources,
  maxResults,
  onSourceToggle,
  onMaxResultsChange,
  showSourceDropdown,
  showResultsDropdown,
  onShowSourceDropdownToggle,
  onShowResultsDropdownToggle
}: ChatLLMInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: ({ query, maxResults, sources }: { query: string; maxResults: 2 | 3 | 5 | 10; sources: Source[] }) =>
      searchPapers(query, maxResults, sources),
    onSuccess: (data) => {
      setSearchResults(data.papers);
      setSelectedPapers([]);
      setIsSearchMode(true);
    },
    onError: (error) => {
      console.error('Search error:', error);
      addMessage('assistant', 'Sorry, I encountered an error while searching for papers. Please try again.');
    },
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: ({ query, paperIds }: { query: string; paperIds?: string[] }) =>
      chatWithPapers(query, paperIds),
    onSuccess: (data) => {
      addMessage('assistant', data.answer || 'I couldn\'t find a specific answer to your question.');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error while processing your question. Please try again.');
    },
  });

  // Handle external input from parent component
  useEffect(() => {
    if (externalInput && externalInput.trim()) {
      const query = externalInput.trim();
      addMessage('user', query);
      
      // Check if this looks like a search query (contains keywords like "find", "search", "papers about", etc.)
      const searchKeywords = ['find', 'search', 'papers about', 'research on', 'studies about', 'articles about'];
      const isSearchQuery = searchKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isSearchQuery) {
        // Handle as search query
        searchMutation.mutate({ query, maxResults, sources: selectedSources });
        addMessage('assistant', `Searching for papers about "${query}"...`);
      } else {
        // Handle as chat query
        const paperIds = currentSessionPapers.length > 0 
          ? currentSessionPapers.map(p => p.id) 
          : undefined;
        chatMutation.mutate({ query, paperIds });
      }
      
      // Notify parent that input has been processed
      onInputProcessed?.();
    }
  }, [externalInput, onInputProcessed, currentSessionPapers, maxResults, selectedSources, searchMutation, chatMutation]);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const query = inputValue.trim();
    addMessage('user', query);
    setInputValue('');

    // Check if this looks like a search query (contains keywords like "find", "search", "papers about", etc.)
    const searchKeywords = ['find', 'search', 'papers about', 'research on', 'studies about', 'articles about'];
    const isSearchQuery = searchKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isSearchQuery) {
      // Handle as search query
      searchMutation.mutate({ query, maxResults, sources: selectedSources });
      addMessage('assistant', `Searching for papers about "${query}"...`);
    } else {
      // Handle as chat query
      const paperIds = currentSessionPapers.length > 0 
        ? currentSessionPapers.map(p => p.id) 
        : undefined;
      chatMutation.mutate({ query, paperIds });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleSelect = (paper: Paper) => {
    setSelectedPapers(prev => {
      const isSelected = prev.some(p => p.id === paper.id);
      if (isSelected) {
        return prev.filter(p => p.id !== paper.id);
      } else {
        return [...prev, paper];
      }
    });
  };

  const handleAddToSession = () => {
    if (selectedPapers.length > 0) {
      onAddToSession(selectedPapers);
      setSelectedPapers([]);
      setIsSearchMode(false);
      setSearchResults([]);
      addMessage('assistant', `Added ${selectedPapers.length} paper${selectedPapers.length !== 1 ? 's' : ''} to your session!`);
    }
  };



  return (
    <div className="font-sf">
      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-slate-100 border border-slate-200 text-slate-900'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed font-sf">{message.content}</p>
              <p className={`text-xs mt-2 font-medium ${
                message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Search Results */}
      {isSearchMode && searchResults.length > 0 && (
        <div className="border-t border-slate-200/60 p-4 mt-4 bg-white/50 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 font-sf">
              Found {searchResults.length} paper{searchResults.length !== 1 ? 's' : ''}
            </h3>
            {selectedPapers.length > 0 && (
              <button
                onClick={handleAddToSession}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 text-sm font-sf"
              >
                Add {selectedPapers.length} to Session
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((paper) => (
              <div
                key={paper.id}
                className={`p-4 rounded-xl border transition-all duration-200 shadow-sm ${
                  selectedPapers.some(p => p.id === paper.id)
                    ? 'border-blue-300 bg-blue-50/90 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <LaTeXText 
                    text={paper.title}
                    as="h4"
                    className="text-sm font-semibold text-slate-900 line-clamp-2 font-sf"
                  />
                  <button
                    onClick={() => handleToggleSelect(paper)}
                    className={`ml-2 p-1.5 rounded-lg transition-colors ${
                      selectedPapers.some(p => p.id === paper.id)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-2 font-sf">{paper.authors.join(', ')}</p>
                <LaTeXText 
                  text={paper.abstract || ''}
                  as="p"
                  className="text-xs text-slate-600 line-clamp-2 mb-3 font-sf"
                />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    paper.source === 'arXiv' 
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {paper.source}
                  </span>
                  {paper.year && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {paper.year}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
