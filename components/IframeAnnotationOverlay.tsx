'use client';

import { useState, useRef } from 'react';
import { Annotation, AnnotationTool, HighlightColor, TextAlignment } from '@/types/annotations';

interface IframeAnnotationOverlayProps {
  pageNumber: number;
  tool: AnnotationTool;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  scale: number;
  children: React.ReactNode;
}

export default function IframeAnnotationOverlay({
  pageNumber,
  tool,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  scale,
  children
}: IframeAnnotationOverlayProps) {
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

  const handleClick = (event: React.MouseEvent) => {
    // Only handle clicks for sticky notes and text annotations in iframe mode
    // Highlighting is not available in iframe mode due to security restrictions
    if (tool.type === 'sticky-note' || tool.type === 'text') {
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
      className="relative w-full h-full"
      onClick={handleClick}
    >
      {/* Iframe Content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Annotation Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {pageAnnotations.map((annotation) => (
          <div key={annotation.id}>
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
      </div>
    </div>
  );
}
