'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Paper, Source } from '@/types/paper';
import SearchBar from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import SelectionTray from '@/components/SelectionTray';
import SessionCanvas from '@/components/SessionCanvas';
import PdfPopover from '@/components/PdfPopover';

// API function
const searchPapers = async (query: string, maxResults: 2 | 5 | 10, sources: Source[]) => {
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

export default function AstroApp() {
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [sessionPapers, setSessionPapers] = useState<Paper[]>([]);
  const [openPdfPaper, setOpenPdfPaper] = useState<Paper | null>(null);

  // Load session papers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('astro-session-papers');
    if (saved) {
      try {
        setSessionPapers(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading session papers:', error);
      }
    }
  }, []);

  // Save session papers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('astro-session-papers', JSON.stringify(sessionPapers));
  }, [sessionPapers]);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: ({ query, maxResults, sources }: { query: string; maxResults: 2 | 5 | 10; sources: Source[] }) =>
      searchPapers(query, maxResults, sources),
    onSuccess: (data) => {
      setSearchResults(data.papers);
      setSelectedPapers([]); // Clear previous selection
    },
    onError: (error) => {
      console.error('Search error:', error);
      // You might want to show a toast notification here
    },
  });

  const handleSearch = (query: string, maxResults: 2 | 5 | 10, sources: Source[]) => {
    searchMutation.mutate({ query, maxResults, sources });
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

  const handleAddSelected = () => {
    setSessionPapers(prev => {
      const newPapers = [...prev];
      selectedPapers.forEach(paper => {
        if (!newPapers.some(p => p.id === paper.id)) {
          newPapers.push(paper);
        }
      });
      return newPapers;
    });
    setSelectedPapers([]);
  };

  const handleClearSelection = () => {
    setSelectedPapers([]);
  };

  const handleOpenPaper = (paper: Paper) => {
    setOpenPdfPaper(paper);
  };

  const handleClosePdf = () => {
    setOpenPdfPaper(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Starry Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Astro Research Companion
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover and explore astronomical research papers with AI-powered insights
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar
            onSearch={handleSearch}
            isLoading={searchMutation.isPending}
          />
        </div>

        {/* Results Section */}
        {searchMutation.isPending && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 backdrop-blur border border-slate-700 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-4 bg-slate-700 rounded mb-4"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded mb-4 w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                    <div className="h-6 bg-slate-700 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults.length > 0 && !searchMutation.isPending && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((paper) => (
                <ResultCard
                  key={paper.id}
                  paper={paper}
                  isSelected={selectedPapers.some(p => p.id === paper.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Session Canvas */}
        <div className="mb-12">
          <SessionCanvas
            papers={sessionPapers}
            onOpenPaper={handleOpenPaper}
          />
        </div>

        {/* Selection Tray */}
        <SelectionTray
          selectedPapers={selectedPapers}
          onAddSelected={handleAddSelected}
          onClearSelection={handleClearSelection}
        />

        {/* PDF Popover */}
        <PdfPopover
          paper={openPdfPaper}
          isOpen={!!openPdfPaper}
          onClose={handleClosePdf}
        />
      </div>
    </div>
  );
}
