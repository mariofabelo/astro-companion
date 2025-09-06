'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Paper } from '@/types/paper';

interface PaperNode {
  id: string;
  paper: Paper;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
}

interface PaperCanvasProps {
  papers: Paper[];
  onPaperClick: (paper: Paper) => void;
  onPaperSelect: (paper: Paper) => void;
  selectedPaper?: Paper;
}

export default function PaperCanvas({ 
  papers, 
  onPaperClick, 
  onPaperSelect, 
  selectedPaper 
}: PaperCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<PaperNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Initialize paper nodes when papers change
  useEffect(() => {
    const newNodes: PaperNode[] = papers.map((paper, index) => {
      // Check if node already exists
      const existingNode = nodes.find(n => n.paper.id === paper.id);
      if (existingNode) {
        return existingNode;
      }

      // Create new node with random position
      const cols = Math.ceil(Math.sqrt(papers.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        id: paper.id,
        paper,
        x: col * 300 + 100,
        y: row * 400 + 100,
        width: 280,
        height: 360,
        isSelected: selectedPaper?.id === paper.id
      };
    });

    setNodes(newNodes);
  }, [papers]);

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
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle click or Ctrl+click
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

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
    const maxY = Math.max(...nodes.map(n => n.y + n.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;

    const scaleX = (canvasRect.width - padding * 2) / contentWidth;
    const scaleY = (canvasRect.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(newScale);
    setCanvasOffset({
      x: (canvasRect.width - contentWidth * newScale) / 2 - minX * newScale,
      y: (canvasRect.height - contentHeight * newScale) / 2 - minY * newScale
    });
  }, [nodes]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden">
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
          className="relative"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute border-2 rounded-xl shadow-lg transition-all duration-200 cursor-pointer ${
                node.isSelected
                  ? 'border-blue-500 shadow-blue-200/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.paper)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.paper)}
            >
              {/* Paper Preview */}
              <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                      {node.paper.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${
                      node.paper.source === 'arXiv' 
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {node.paper.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {node.paper.authors.join(', ')}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 flex-1">
                  <p className="text-xs text-slate-700 line-clamp-6 leading-relaxed">
                    {node.paper.abstract}
                  </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
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
                    <button
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Open PDF"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span>Click to select • Double-click to open • Ctrl+drag to pan • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
