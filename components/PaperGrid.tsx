'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';

interface PaperGridProps {
  papers: Paper[];
  onPaperClick: (paper: Paper) => void;
  onPaperSelect: (paper: Paper) => void;
  selectedPaper?: Paper;
}

export default function PaperGrid({ 
  papers, 
  onPaperClick, 
  onPaperSelect, 
  selectedPaper 
}: PaperGridProps) {
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null);

  if (papers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No papers yet</h3>
          <p className="text-slate-500">Search for papers to add them to this space</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className={`group relative bg-white rounded-xl border-2 shadow-lg transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-105 ${
              selectedPaper?.id === paper.id
                ? 'border-blue-500 shadow-blue-200/50 ring-2 ring-blue-200'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => onPaperClick(paper)}
            onMouseEnter={() => setHoveredPaper(paper.id)}
            onMouseLeave={() => setHoveredPaper(null)}
          >
            {/* Paper Preview Card */}
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 leading-tight mb-2">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-1">
                    {paper.authors.join(', ')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-3 flex-shrink-0 ${
                  paper.source === 'arXiv' 
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {paper.source}
                </span>
              </div>
              
              {/* Abstract */}
              <div className="flex-1 mb-4">
                <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {paper.year && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {paper.year}
                  </span>
                )}
                {paper.citations && paper.citations > 0 && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {paper.citations} citations
                  </span>
                )}
                {paper.journal && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    {paper.journal}
                  </span>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPaperClick(paper);
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaperSelect(paper);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                  title="Open PDF"
                >
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Hover Overlay */}
            {hoveredPaper === paper.id && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
            )}
          </div>
        ))}
      </div>
      
      {/* Instructions */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-600">
          <span>Click to view details</span>
          <span>•</span>
          <span>Click PDF icon to open</span>
        </div>
      </div>
    </div>
  );
}

