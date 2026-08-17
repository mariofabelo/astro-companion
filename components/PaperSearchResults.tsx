'use client';

import { useState } from 'react';
import { Paper, Source } from '@/types/paper';
import { useMutation } from '@tanstack/react-query';
import { ResearchSpace } from '@/lib/research-spaces';
import LaTeXText from './LaTeXText';

interface PaperSearchResultsProps {
  searchResults: Paper[];
  researchSpaces: ResearchSpace[];
  onAddToSpace: (papers: Paper[], spaceId: string) => void;
  onCreateNewSpace: (papers: Paper[], spaceTitle: string) => void;
  onClose: () => void;
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

export default function PaperSearchResults({
  searchResults,
  researchSpaces,
  onAddToSpace,
  onCreateNewSpace,
  onClose
}: PaperSearchResultsProps) {
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [showSpaceSelector, setShowSpaceSelector] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState('');

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

  const handleSelectAll = () => {
    if (selectedPapers.length === searchResults.length) {
      setSelectedPapers([]);
    } else {
      setSelectedPapers([...searchResults]);
    }
  };

  const handleAddToSpace = () => {
    if (selectedPapers.length > 0) {
      setShowSpaceSelector(true);
    }
  };

  const handleCreateNewSpace = () => {
    if (selectedPapers.length > 0) {
      setShowCreateSpace(true);
    }
  };

  const handleSpaceSelection = (spaceId: string) => {
    onAddToSpace(selectedPapers, spaceId);
    setSelectedPapers([]);
    setShowSpaceSelector(false);
    onClose();
  };

  const handleCreateSpace = () => {
    if (newSpaceTitle.trim()) {
      onCreateNewSpace(selectedPapers, newSpaceTitle.trim());
      setSelectedPapers([]);
      setShowCreateSpace(false);
      setNewSpaceTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Search Results</h2>
            <p className="text-slate-600 mt-1">Found {searchResults.length} papers</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection Controls */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedPapers.length === searchResults.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-slate-600">
                {selectedPapers.length} of {searchResults.length} selected
              </span>
            </div>
            
            {selectedPapers.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToSpace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add to Existing Space
                </button>
                <button
                  onClick={handleCreateNewSpace}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium"
                >
                  Create New Space
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Papers Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((paper) => (
              <div
                key={paper.id}
                className={`p-6 rounded-xl border transition-all duration-200 shadow-sm cursor-pointer ${
                  selectedPapers.some(p => p.id === paper.id)
                    ? 'border-blue-300 bg-blue-50/90 shadow-md ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
                onClick={() => handleToggleSelect(paper)}
              >
                <div className="flex justify-between items-start mb-3">
                  <LaTeXText 
                    text={paper.title}
                    as="h3"
                    className="text-lg font-semibold text-slate-900 line-clamp-2 leading-tight"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(paper);
                    }}
                    className={`ml-3 p-2 rounded-lg transition-colors flex-shrink-0 ${
                      selectedPapers.some(p => p.id === paper.id)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {paper.authors.join(', ')}
                </p>
                
                <LaTeXText 
                  text={paper.abstract || ''}
                  as="p"
                  className="text-sm text-slate-700 line-clamp-3 mb-4 leading-relaxed"
                />
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    paper.source === 'arXiv' 
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {paper.source}
                  </span>
                  {paper.year && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {paper.year}
                    </span>
                  )}
                  {paper.citations && paper.citations > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      {paper.citations} citations
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Space Selector Modal */}
        {showSpaceSelector && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Add to Space</h3>
              <p className="text-slate-600 mb-6">
                Select a space to add {selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''} to:
              </p>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {researchSpaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceSelection(space.id)}
                    className="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-semibold text-slate-900">{space.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{space.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {space.papers.length} papers • {space.timestamp}
                    </p>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSpaceSelector(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewSpace}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
                >
                  Create New Space
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create New Space Modal */}
        {showCreateSpace && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Space</h3>
              <p className="text-slate-600 mb-6">
                Create a new research space for {selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''}:
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Space Title
                </label>
                <input
                  type="text"
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="Enter space title..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateSpace(false);
                    setNewSpaceTitle('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSpace}
                  disabled={!newSpaceTitle.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Space
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
