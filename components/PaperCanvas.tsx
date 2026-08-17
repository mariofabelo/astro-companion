'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Paper } from '@/types/paper';
import LaTeXText from './LaTeXText';
import { IoWarning } from 'react-icons/io5';
import { downloadPaper } from '@/lib/download';
import { isArxivSource, resolvePaperUrls } from '@/lib/paper-utils';

interface PaperNode {
  id: string;
  paper: Paper;
  x: number;
  y: number;
  width: number;
  isSelected: boolean;
}

interface PaperCanvasProps {
  papers: Paper[];
  onPaperClick: (paper: Paper) => void;
  onPaperSelect: (paper: Paper) => void;
  selectedPaper?: Paper;
  onDeletePaper?: (paperId: string) => void;
}

export default function PaperCanvas({ 
  papers, 
  onPaperClick, 
  onPaperSelect, 
  selectedPaper,
  onDeletePaper
}: PaperCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<PaperNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.6); // Start with a smaller scale to prevent jump
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
      // Show user-friendly error message
      alert(`Failed to download paper: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  // Initialize paper nodes when papers change
  useEffect(() => {
    if (!papers || papers.length === 0) {
      setNodes([]);
      return;
    }
    
    const newNodes: PaperNode[] = papers.map((paper, index) => {
      // Create new node with better spacing and sizing
      const cols = Math.ceil(Math.sqrt(papers.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Better spacing and sizing for the available space
      const cardWidth = 320;
      const spacingX = 50;
      const spacingY = 50;
      const startX = 50;
      const startY = 50;
      
      return {
        id: paper.id,
        paper,
        x: startX + col * (cardWidth + spacingX),
        y: startY + row * 500, // Use a base spacing, cards will size themselves
        width: cardWidth,
        isSelected: selectedPaper?.id === paper.id
      };
    });

    setNodes(newNodes);
    
    // Only auto-fit to view if this is the first time papers are loaded (nodes.length === 0)
    // This prevents the jump when switching from Grid to Canvas view
    if (newNodes.length > 0 && nodes.length === 0) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const minX = Math.min(...newNodes.map(n => n.x));
          const maxX = Math.max(...newNodes.map(n => n.x + n.width));
          const minY = Math.min(...newNodes.map(n => n.y));
          // Estimate content height based on number of rows and base card height
          const estimatedCardHeight = 400; // Base estimate
          const cols = Math.ceil(Math.sqrt(newNodes.length));
          const spacingY = 50;
          const maxY = minY + Math.ceil(newNodes.length / cols) * (estimatedCardHeight + spacingY);

          const contentWidth = maxX - minX;
          const contentHeight = maxY - minY;
          const padding = 80;

          const scaleX = (canvasRect.width - padding * 2) / contentWidth;
          const scaleY = (canvasRect.height - padding * 2) / contentHeight;
          const newScale = Math.min(scaleX, scaleY, 1.2);

          setScale(newScale);
          setCanvasOffset({
            x: (canvasRect.width - contentWidth * newScale) / 2 - minX * newScale,
            y: (canvasRect.height - contentHeight * newScale) / 2 - minY * newScale
          });
        }
      }, 100);
    }
  }, [papers, selectedPaper, nodes.length]);

  // Update selected state when selectedPaper changes
  useEffect(() => {
    setNodes(prev => prev.map(node => ({
      ...node,
      isSelected: selectedPaper?.id === node.paper.id
    })));
  }, [selectedPaper]);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setDragStart({ 
          x: e.clientX - node.x, 
          y: e.clientY - node.y 
        });
      }
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setNodes(prev => prev.map(node => 
        node.isSelected ? { ...node, x: deltaX, y: deltaY } : node
      ));
    } else if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isPanning, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow panning with right-click, middle-click, Ctrl+left-click, or left-click on empty space
    const isRightClick = e.button === 2;
    const isMiddleClick = e.button === 1;
    const isCtrlClick = e.button === 0 && e.ctrlKey;
    const isLeftClickOnEmpty = e.button === 0 && !e.ctrlKey && 
      (e.target === e.currentTarget || 
       (e.target as HTMLElement).classList.contains('relative') ||
       (e.target as HTMLElement).tagName === 'DIV' && 
       !(e.target as HTMLElement).closest('[data-paper-node]'));
    
    if (isRightClick || isMiddleClick || isCtrlClick || isLeftClickOnEmpty) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, scale * delta));
    
    if (newScale === scale) return; // No change in scale
    
    // Get the mouse position relative to the canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Calculate the world position of the mouse before zoom
    const worldX = (mouseX - canvasOffset.x) / scale;
    const worldY = (mouseY - canvasOffset.y) / scale;
    
    // Calculate the new offset to keep the world position under the mouse
    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;
    
    setScale(newScale);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [scale, canvasOffset]);

  const handleNodeClick = useCallback((e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    onPaperClick(paper);
  }, [onPaperClick]);

  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    onPaperSelect(paper);
  }, [onPaperSelect]);

  const resetView = useCallback(() => {
    setScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  }, []);

  const fitToView = useCallback(() => {
    if (nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + n.width));
    const minY = Math.min(...nodes.map(n => n.y));
    
    // Estimate content height based on number of rows
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const estimatedCardHeight = 400;
    const spacingY = 50;
    const maxY = minY + Math.ceil(nodes.length / cols) * (estimatedCardHeight + spacingY);

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 80; // Increased padding for better spacing

    const scaleX = (canvasRect.width - padding * 2) / contentWidth;
    const scaleY = (canvasRect.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1.2); // Allow slight zoom in

    setScale(newScale);
    setCanvasOffset({
      x: (canvasRect.width - contentWidth * newScale) / 2 - minX * newScale,
      y: (canvasRect.height - contentHeight * newScale) / 2 - minY * newScale
    });
  }, [nodes]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden" style={{ minHeight: '400px', width: '100%' }}>
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={resetView}
          className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={fitToView}
          className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          title="Fit to View"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-600">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            minWidth: '100%',
            minHeight: '100%'
          }}
        >
          
          
          {nodes.map((node) => (
            <div
              key={node.id}
              data-paper-node="true"
              className={`absolute border-2 rounded-xl shadow-lg transition-all duration-200 cursor-pointer ${
                node.isSelected
                  ? 'border-blue-500 shadow-blue-200/50 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                zIndex: 10
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.paper)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.paper)}
            >
              {/* Paper Preview */}
              <div className="w-full bg-white rounded-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-start justify-between mb-2">
                    <LaTeXText 
                      text={node.paper.title}
                      as="h3"
                      className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight"
                    />
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${
                      isArxivSource(node.paper.source)
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isArxivSource(node.paper.source) ? 'arXiv' : node.paper.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {node.paper.authors.join(', ')}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 min-h-0">
                  <LaTeXText 
                    text={node.paper.abstract || 'No abstract available'}
                    as="p"
                    className="text-xs text-slate-700 leading-relaxed"
                  />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {node.paper.year && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          {node.paper.year}
                        </span>
                      )}
                      {node.paper.citations && node.paper.citations > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {node.paper.citations}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {(resolvePaperUrls(node.paper).url_pdf || node.paper.source === 'ads') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPaper(node.paper);
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPaperSelect(node.paper);
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Open PDF"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      {onDeletePaper && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(node.paper.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Remove from Space"
                        >
                          <svg className="w-4 h-4 text-slate-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-none border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span>Click to select • Double-click to open • Click empty space to pan • Scroll to zoom at cursor</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoWarning className="w-6 h-6 text-red-600" />
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
