'use client';

import { Paper } from '@/types/paper';
import CanvasNode from './CanvasNode';

interface SessionCanvasProps {
  papers: Paper[];
  onOpenPaper: (paper: Paper) => void;
}

export default function SessionCanvas({ papers, onOpenPaper }: SessionCanvasProps) {
  if (papers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No papers in session</p>
          <p className="text-sm">Search for papers and add them to your research session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Research Session</h2>
        <p className="text-slate-400">
          {papers.length} paper{papers.length !== 1 ? 's' : ''} in your session
        </p>
      </div>

      {/* Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {papers.map((paper) => (
          <CanvasNode
            key={paper.id}
            paper={paper}
            onOpen={() => onOpenPaper(paper)}
          />
        ))}
      </div>

      {/* Connection Lines (Visual Enhancement) */}
      {papers.length > 1 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: -1 }}
        >
          {papers.map((paper, index) => {
            if (index === papers.length - 1) return null;
            
            // Simple connecting lines between nodes
            // In a more sophisticated implementation, you might want to
            // calculate actual positions and create curved paths
            return (
              <line
                key={`connection-${index}`}
                x1="50%"
                y1="50%"
                x2="50%"
                y2="50%"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
