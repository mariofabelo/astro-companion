'use client';

import { Paper } from '@/types/paper';
import LaTeXText from './LaTeXText';

interface ResultCardProps {
  paper: Paper;
  isSelected: boolean;
  onToggleSelect: (paper: Paper) => void;
}

export default function ResultCard({ paper, isSelected, onToggleSelect }: ResultCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <LaTeXText 
            text={paper.title}
            as="h3"
            className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight"
          />

          {/* Authors */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {paper.authors?.join(", ")}
          </p>

          {/* Abstract */}
          {paper.abstract && (
            <LaTeXText 
              text={paper.abstract}
              as="p"
              className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed"
            />
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Source badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              paper.source === 'arXiv' 
                ? 'bg-orange-100 text-orange-700'
                : paper.source === 'ads'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {paper.source.toUpperCase()}
            </span>

            {/* Year badge */}
            {paper.year && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {paper.year}
              </span>
            )}

            {/* Categories */}
            {paper.categories && paper.categories.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {paper.categories[0]}
              </span>
            )}

            {/* Citation count */}
            {paper.citation_count && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {paper.citation_count} citations
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleSelect(paper)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Session
              </div>
            )}
          </button>

          {/* External Links */}
          <div className="flex gap-1">
            <a
              href={paper.url_html}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={`View on ${paper.source === 'arXiv' ? 'arXiv' : 'ADS'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {paper.url_pdf && (
              <a
                href={paper.url_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
