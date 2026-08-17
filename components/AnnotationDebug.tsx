'use client';

import { useAnnotations } from '@/lib/useAnnotations';
import { AnnotationTool } from '@/types/annotations';

interface AnnotationDebugProps {
  paperId: string;
}

export default function AnnotationDebug({ paperId }: AnnotationDebugProps) {
  const {
    tool,
    annotations,
    setTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAllAnnotations
  } = useAnnotations({ paperId });

  const testAddHighlight = () => {
    const highlight = {
      id: `test-highlight-${Date.now()}`,
      type: 'highlight' as const,
      pageNumber: 1,
      x: 10,
      y: 20,
      width: 30,
      height: 5,
      color: 'yellow' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    addAnnotation(highlight);
  };

  const testAddStickyNote = () => {
    const stickyNote = {
      id: `test-sticky-${Date.now()}`,
      type: 'sticky-note' as const,
      pageNumber: 1,
      x: 50,
      y: 60,
      content: 'Test sticky note',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    addAnnotation(stickyNote);
  };

  const testAddText = () => {
    const textAnnotation = {
      id: `test-text-${Date.now()}`,
      type: 'text' as const,
      pageNumber: 1,
      x: 25,
      y: 75,
      content: 'Test text annotation',
      alignment: 'center' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    addAnnotation(textAnnotation);
  };

  return (
    <div className="p-4 bg-slate-100 rounded-lg">
      <h3 className="font-semibold text-slate-800 mb-4">Annotation Debug Panel</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-slate-700 mb-2">Current Tool:</h4>
          <p className="text-sm text-slate-600">
            Type: {tool.type} | Color: {tool.color || 'N/A'} | Alignment: {tool.alignment || 'N/A'}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-slate-700 mb-2">Annotations ({annotations.length}):</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {annotations.map((ann) => (
              <div key={ann.id} className="text-xs bg-white p-2 rounded border">
                <div className="font-medium">{ann.type}</div>
                <div>Page: {ann.pageNumber}, Position: ({ann.x}, {ann.y})</div>
                {ann.type === 'highlight' && <div>Color: {ann.color}</div>}
                {ann.type === 'sticky-note' && <div>Content: {ann.content}</div>}
                {ann.type === 'text' && <div>Content: {ann.content}, Align: {ann.alignment}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={testAddHighlight}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
          >
            Add Highlight
          </button>
          <button
            onClick={testAddStickyNote}
            className="px-3 py-1 bg-orange-200 text-orange-800 rounded text-sm hover:bg-orange-300"
          >
            Add Sticky Note
          </button>
          <button
            onClick={testAddText}
            className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm hover:bg-blue-300"
          >
            Add Text
          </button>
          <button
            onClick={clearAllAnnotations}
            className="px-3 py-1 bg-red-200 text-red-800 rounded text-sm hover:bg-red-300"
          >
            Clear All
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTool({ type: 'highlight', color: 'yellow' })}
            className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm hover:bg-slate-300"
          >
            Set Highlight Tool
          </button>
          <button
            onClick={() => setTool({ type: 'sticky-note' })}
            className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm hover:bg-slate-300"
          >
            Set Sticky Note Tool
          </button>
          <button
            onClick={() => setTool({ type: 'text', alignment: 'center' })}
            className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm hover:bg-slate-300"
          >
            Set Text Tool
          </button>
        </div>
      </div>
    </div>
  );
}


