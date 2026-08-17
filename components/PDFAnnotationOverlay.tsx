'use client';

import { useState, useRef, useEffect } from 'react';
import { Annotation, AnnotationTool, HighlightColor, TextAlignment } from '@/types/annotations';

interface PDFAnnotationOverlayProps {
  pageNumber: number;
  tool: AnnotationTool;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  scale: number;
  children: React.ReactNode;
}

export default function PDFAnnotationOverlay({
  pageNumber,
  tool,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  scale,
  children
}: PDFAnnotationOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter annotations for current page
  const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNumber);

  const getRelativePosition = (event: React.MouseEvent): { x: number; y: number } => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    // Only handle if it's a left click and not on an existing annotation
    if (event.button !== 0) return;
    
    if (tool.type === 'highlight') {
      const pos = getRelativePosition(event);
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentPos(pos);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDrawing && tool.type === 'highlight' && startPos) {
      const pos = getRelativePosition(event);
      setCurrentPos(pos);
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (isDrawing && tool.type === 'highlight' && startPos && currentPos) {
      // Create highlight annotation
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      
      if (width > 1 && height > 1) { // Minimum size threshold
        const annotation: Annotation = {
          id: `highlight-${Date.now()}`,
          type: 'highlight',
          pageNumber,
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width,
          height,
          color: tool.color || 'yellow',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        onAddAnnotation(annotation);
      }
    } else if (tool.type === 'sticky-note' || tool.type === 'text') {
      // Create sticky note or text annotation
      const pos = getRelativePosition(event);
      const annotation: Annotation = {
        id: `${tool.type}-${Date.now()}`,
        type: tool.type,
        pageNumber,
        x: pos.x,
        y: pos.y,
        content: '',
        isEditing: true,
        ...(tool.type === 'text' && { alignment: tool.alignment || 'left' }),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      onAddAnnotation(annotation);
      setEditingAnnotation(annotation.id);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleAnnotationClick = (annotationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingAnnotation(annotationId);
  };

  const handleAnnotationDelete = (annotationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteAnnotation(annotationId);
  };

  const handleContentChange = (annotationId: string, content: string) => {
    onUpdateAnnotation(annotationId, { content, updatedAt: new Date() });
  };

  const handleFinishEditing = (annotationId: string) => {
    setEditingAnnotation(null);
    onUpdateAnnotation(annotationId, { isEditing: false, updatedAt: new Date() });
  };

  const getHighlightColorClass = (color: HighlightColor): string => {
    const colorMap = {
      yellow: 'bg-yellow-300/60 border-yellow-400',
      blue: 'bg-blue-300/60 border-blue-400',
      orange: 'bg-orange-300/60 border-orange-400',
      purple: 'bg-purple-300/60 border-purple-400'
    };
    return colorMap[color];
  };

  const getTextAlignmentClass = (alignment: TextAlignment): string => {
    const alignmentMap = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    return alignmentMap[alignment];
  };

  return (
    <div 
      ref={overlayRef}
      className="relative w-full h-full annotation-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
    >
      {/* PDF Content */}
      {children}

      {/* Annotation Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {pageAnnotations.map((annotation) => (
          <div key={annotation.id}>
            {annotation.type === 'highlight' && (
              <div
                className={`absolute border-2 ${getHighlightColorClass(annotation.color)} pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity`}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: `${annotation.width}%`,
                  height: `${annotation.height}%`,
                }}
                onClick={(e) => handleAnnotationClick(annotation.id, e)}
                title="Click to edit, right-click to delete"
              >
                <button
                  onClick={(e) => handleAnnotationDelete(annotation.id, e)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            )}

            {annotation.type === 'sticky-note' && (
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                }}
              >
                <div className="relative">
                  <div className="w-48 h-32 bg-yellow-200 border border-yellow-300 rounded shadow-lg">
                    {editingAnnotation === annotation.id ? (
                      <div className="p-2 h-full">
                        <textarea
                          value={annotation.content}
                          onChange={(e) => handleContentChange(annotation.id, e.target.value)}
                          onBlur={() => handleFinishEditing(annotation.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleFinishEditing(annotation.id);
                            }
                          }}
                          className="w-full h-full resize-none border-none bg-transparent text-sm focus:outline-none"
                          placeholder="Add your note..."
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div 
                        className="p-2 h-full cursor-pointer hover:bg-yellow-300/50 transition-colors"
                        onClick={(e) => handleAnnotationClick(annotation.id, e)}
                      >
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {annotation.content || 'Click to add note...'}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleAnnotationDelete(annotation.id, e)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                  {/* Sticky note fold */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-8 border-t-8 border-l-transparent border-t-yellow-300"></div>
                </div>
              </div>
            )}

            {annotation.type === 'text' && (
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                }}
              >
                <div className="relative">
                  {editingAnnotation === annotation.id ? (
                    <div className="bg-white border border-gray-300 rounded shadow-lg p-2 min-w-48">
                      <textarea
                        value={annotation.content}
                        onChange={(e) => handleContentChange(annotation.id, e.target.value)}
                        onBlur={() => handleFinishEditing(annotation.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleFinishEditing(annotation.id);
                          }
                        }}
                        className="w-full resize-none border-none focus:outline-none text-sm"
                        placeholder="Add text annotation..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div 
                      className={`bg-white/90 border border-gray-300 rounded shadow-lg p-2 min-w-48 cursor-pointer hover:bg-white transition-colors ${getTextAlignmentClass(annotation.alignment)}`}
                      onClick={(e) => handleAnnotationClick(annotation.id, e)}
                    >
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {annotation.content || 'Click to add text...'}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleAnnotationDelete(annotation.id, e)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Drawing preview for highlights */}
        {isDrawing && startPos && currentPos && tool.type === 'highlight' && (
          <div
            className={`absolute border-2 ${getHighlightColorClass(tool.color || 'yellow')} pointer-events-none opacity-70`}
            style={{
              left: `${Math.min(startPos.x, currentPos.x)}%`,
              top: `${Math.min(startPos.y, currentPos.y)}%`,
              width: `${Math.abs(currentPos.x - startPos.x)}%`,
              height: `${Math.abs(currentPos.y - startPos.y)}%`,
            }}
          />
        )}

        {/* Tool cursor indicator */}
        {tool.type === 'highlight' && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg pointer-events-none">
            Highlight Mode - Click and drag
          </div>
        )}
        {tool.type === 'sticky-note' && (
          <div className="absolute top-4 right-4 bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg pointer-events-none">
            Sticky Note Mode - Click to place
          </div>
        )}
        {tool.type === 'text' && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg pointer-events-none">
            Text Mode - Click to place
          </div>
        )}
      </div>
    </div>
  );
}


