'use client';

import { useEffect, useState } from 'react';
import { Paper } from '@/types/paper';

interface PaperIdentificationPanelProps {
  paper: Paper;
  onOpenPDF: () => void;
  onClose: () => void;
}

export default function PaperIdentificationPanel({ 
  paper, 
  onOpenPDF, 
  onClose 
}: PaperIdentificationPanelProps) {
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');

  // Set PDF URL for papers
  useEffect(() => {
    if (paper.source === 'ads' && paper.id.startsWith('ads:')) {
      // For ADS papers, use the abstract page which has PDF links
      const bibcode = paper.id.replace('ads:', '');
      setResolvedPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
    } else {
      // For non-ADS papers, use existing logic
      setResolvedPdfUrl(paper.url_pdf || '');
    }
  }, [paper.id, paper.source, paper.url_pdf]);
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Paper Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            paper.source === 'arXiv' 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {paper.source}
          </span>
          {paper.year && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
              {paper.year}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Title</h3>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {paper.title}
          </h1>
        </div>

        {/* Authors */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Authors</h3>
          <div className="space-y-1">
            {paper.authors.map((author, index) => (
              <p key={index} className="text-sm text-slate-600">
                {author}
              </p>
            ))}
          </div>
        </div>

        {/* Abstract */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Abstract</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {paper.abstract}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          {paper.journal && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Journal</h3>
              <p className="text-sm text-slate-600">{paper.journal}</p>
            </div>
          )}

          {paper.doi && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">DOI</h3>
              <button
                onClick={() => handleExternalLink(`https://doi.org/${paper.doi}`)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {paper.doi}
              </button>
            </div>
          )}

          {paper.publishedDate && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Published</h3>
              <p className="text-sm text-slate-600">{paper.publishedDate}</p>
            </div>
          )}

          {paper.citations && paper.citations > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Citations</h3>
              <p className="text-sm text-slate-600">{paper.citations} citations</p>
            </div>
          )}

          {paper.categories && paper.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-1">
                {paper.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <button
          onClick={onOpenPDF}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Open PDF
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExternalLink(paper.url_html)}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Online
          </button>
          
          {resolvedPdfUrl && (
            <button
              onClick={() => handleExternalLink(resolvedPdfUrl)}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Direct PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
