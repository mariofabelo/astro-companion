'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';
import { ResearchSpace } from '@/lib/research-spaces';

interface PaperUploadPreviewProps {
  paper: Paper;
  researchSpaces: ResearchSpace[];
  onAddToSpace: (papers: Paper[], spaceId: string) => void;
  onCreateNewSpace: (papers: Paper[], spaceTitle: string) => void;
  onClose: () => void;
}

export default function PaperUploadPreview({
  paper,
  researchSpaces,
  onAddToSpace,
  onCreateNewSpace,
  onClose
}: PaperUploadPreviewProps) {
  const [showSpaceSelector, setShowSpaceSelector] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState('');

  const handleAddToSpace = () => {
    setShowSpaceSelector(true);
  };

  const handleCreateNewSpace = () => {
    setShowCreateSpace(true);
  };

  const handleSpaceSelection = (spaceId: string) => {
    onAddToSpace([paper], spaceId);
    setShowSpaceSelector(false);
    onClose();
  };

  const handleCreateSpace = () => {
    if (newSpaceTitle.trim()) {
      onCreateNewSpace([paper], newSpaceTitle.trim());
      setShowCreateSpace(false);
      setNewSpaceTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Paper Uploaded Successfully!</h2>
            <p className="text-slate-600 mt-1">Add this paper to a research space</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Paper Preview */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              {/* Paper Icon */}
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {/* Paper Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                  {paper.title}
                </h3>
                
                {paper.authors && paper.authors.length > 0 && (
                  <p className="text-sm text-slate-600 mb-2">
                    {paper.authors.slice(0, 3).join(', ')}
                    {paper.authors.length > 3 && ` and ${paper.authors.length - 3} others`}
                  </p>
                )}

                {paper.abstract && (
                  <p className="text-sm text-slate-700 mb-3 line-clamp-3">
                    {paper.abstract}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  {paper.publishedDate && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {paper.publishedDate}
                    </span>
                  )}
                  {paper.journal && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      {paper.journal}
                    </span>
                  )}
                  {paper.doi && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      DOI: {paper.doi}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={handleAddToSpace}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
            >
              Add to Existing Space
            </button>
            <button
              onClick={handleCreateNewSpace}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              Create New Space
            </button>
          </div>
        </div>

        {/* Space Selector Modal */}
        {showSpaceSelector && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Add to Space</h3>
              <p className="text-slate-600 mb-6">
                Select a space to add this paper to:
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
                Create a new research space for this paper:
              </p>
              
              <div className="mb-6">
                <label htmlFor="spaceTitle" className="block text-sm font-medium text-slate-700 mb-2">
                  Space Title
                </label>
                <input
                  id="spaceTitle"
                  type="text"
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="Enter space title..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
