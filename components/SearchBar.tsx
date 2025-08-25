'use client';

import { useState } from 'react';
import { Source } from '@/types/paper';

interface SearchBarProps {
  onSearch: (query: string, maxResults: 2 | 5 | 10, sources: Source[]) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState<2 | 5 | 10>(5);
  const [sources, setSources] = useState<Source[]>(['arXiv']);
  const [showCountSelector, setShowCountSelector] = useState(false);

  const enableAds = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim(), maxResults, sources);
    }
  };

  const toggleSource = (source: Source) => {
    if (source === 'ads' && !enableAds) return;
    
    setSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Query Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for papers..."
            className="w-full px-4 py-3 text-lg bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            disabled={isLoading}
            minLength={2}
            required
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sources */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Sources:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleSource('arXiv')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sources.includes('arXiv')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                arXiv
              </button>
              <button
                type="button"
                onClick={() => toggleSource('ads')}
                disabled={!enableAds}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !enableAds
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : sources.includes('ads')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={!enableAds ? 'Coming soon' : 'Search ADS'}
              >
                ADS
                {!enableAds && <span className="ml-1 text-xs">(soon)</span>}
              </button>
            </div>
          </div>

          {/* Result Count */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountSelector(!showCountSelector)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {maxResults} results
            </button>

            {showCountSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2 space-y-1">
                  {[2, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setMaxResults(count as 2 | 5 | 10);
                        setShowCountSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        maxResults === count
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {count} results
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || query.trim().length < 2}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
              isLoading || query.trim().length < 2
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Click outside to close count selector */}
      {showCountSelector && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowCountSelector(false)}
        />
      )}
    </div>
  );
}
