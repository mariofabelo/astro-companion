'use client';

import { useEffect, useRef, useState } from 'react';
import { Paper } from '@/types/paper';
import { renderPdfPage } from '@/lib/pdf';

interface PdfPopoverProps {
  paper: Paper | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfPopover({ paper, isOpen, onClose }: PdfPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  // Set PDF URL for papers
  useEffect(() => {
    if (isOpen && paper) {
      if (paper.source === 'ads' && paper.id.startsWith('ads:')) {
        // For ADS papers, use the abstract page which has PDF links
        const bibcode = paper.id.replace('ads:', '');
        setPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
      } else {
        // For non-ADS papers, use existing logic
        setPdfUrl(paper.url_pdf || '');
      }
    }
  }, [isOpen, paper]);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const canvas = await renderPdfPage(pdfUrl, currentPage, scale);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = canvas.width;
            canvasRef.current.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);
          }
        }
        // For now, we'll assume a reasonable total page count
        // In a full implementation, you'd get this from the PDF document
        setTotalPages(prev => Math.max(1, prev));
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl, currentPage, scale, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !paper) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-none z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div
        ref={containerRef}
        className={`fixed left-0 top-0 h-full w-96 bg-slate-900 border-r border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white line-clamp-2">
              {paper.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {paper.authors?.join(", ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-4">
              <canvas
                ref={canvasRef}
                className="w-full border border-slate-700 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-sm text-slate-300">
                Page {currentPage} of {totalPages || '?'}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span className="text-sm text-slate-300 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={() => setScale(Math.min(3.0, scale + 0.2))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* External Links */}
          <div className="flex gap-2">
            <a
              href={paper.url_html}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors text-center"
            >
              View on {paper.source}
            </a>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
