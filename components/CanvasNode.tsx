'use client';

import { useEffect, useRef } from 'react';
import { Paper } from '@/types/paper';
import { renderFirstPageToCanvas } from '@/lib/pdf';

interface CanvasNodeProps {
  paper: Paper;
  onOpen: () => void;
}

export default function CanvasNode({ paper, onOpen }: CanvasNodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !paper.url_pdf) return;

    // Use Intersection Observer to lazy load thumbnails
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && canvas) {
            renderFirstPageToCanvas(paper.url_pdf!, canvas).catch((error) => {
              console.error('Failed to render PDF thumbnail:', error);
              // The error handling is already in the renderFirstPageToCanvas function
            });
            observer.unobserve(canvas);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);

    return () => {
      observer.unobserve(canvas);
    };
  }, [paper.url_pdf]);

  return (
    <button
      onClick={onOpen}
      className="group w-full p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left font-sf"
    >
      <div className="flex flex-col space-y-3">
        <div>
          <h3 className="text-sm font-semibold line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors leading-tight font-sf">
            {paper.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-sf">
            {paper.authors?.join(", ")}
          </p>
        </div>
        
        {/* Source and year badges */}
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            paper.source === 'arxiv' 
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
        
        {/* Thumbnail */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            data-pdf-thumb={paper.id}
            className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
          />
          
          {/* PDF indicator */}
          {paper.url_pdf && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm">
              <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
