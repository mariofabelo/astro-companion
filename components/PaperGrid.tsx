'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';
import LaTeXText from './LaTeXText';
import { downloadPaper } from '@/lib/download';

interface PaperGridProps {
  papers: Paper[];
  onPaperClick: (paper: Paper) => void;
  onPaperSelect: (paper: Paper) => void;
  selectedPaper?: Paper;
  onDeletePaper?: (paperId: string) => void;
}

export default function PaperGrid({ 
  papers, 
  onPaperClick, 
  onPaperSelect, 
  selectedPaper,
  onDeletePaper 
}: PaperGridProps) {
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (paperId: string) => {
    setShowDeleteConfirm(paperId);
  };

  const handleConfirmDelete = (paperId: string) => {
    if (onDeletePaper) {
      onDeletePaper(paperId);
    }
    setShowDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleDownloadPaper = async (paper: Paper) => {
    try {
      await downloadPaper(paper);
    } catch (error) {
      console.error('Failed to download paper:', error);
      // You could add a toast notification here
    }
  };

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
                  <LaTeXText 
                    text={paper.title}
                    as="h3"
                    className="text-lg font-semibold text-slate-900 line-clamp-2 leading-tight mb-2"
                  />
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
                <LaTeXText 
                  text={paper.abstract || ''}
                  as="p"
                  className="text-sm text-slate-700 line-clamp-4 leading-relaxed"
                />
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
                <div className="flex items-center gap-1">
                  {paper.url_pdf && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPaper(paper);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                      title="Download PDF"
                    >
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPaperSelect(paper);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                    title="Open PDF"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  {onDeletePaper && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(paper.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Remove from Space"
                    >
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
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
        <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/90 backdrop-blur-none border border-slate-200 rounded-lg text-sm text-slate-600">
          <span>Click to view details</span>
          <span>•</span>
          <span>Click PDF icon to open</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Remove Paper</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-700 mb-6">
              Are you sure you want to remove this paper from the research space? 
              The paper will be removed from this space but can be added again later.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

