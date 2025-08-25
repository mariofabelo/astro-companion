'use client';

import { Paper } from '@/types/paper';

interface SelectionTrayProps {
  selectedPapers: Paper[];
  onAddSelected: () => void;
  onClearSelection: () => void;
}

export default function SelectionTray({ selectedPapers, onAddSelected, onClearSelection }: SelectionTrayProps) {
  if (selectedPapers.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">
              {selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onAddSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Session
              </div>
            </button>

            <button
              onClick={onClearSelection}
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
