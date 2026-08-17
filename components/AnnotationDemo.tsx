'use client';

import { useState } from 'react';
import { AnnotationTool } from '@/types/annotations';
import AnnotationToolbar from './AnnotationToolbar';

export default function AnnotationDemo() {
  const [tool, setTool] = useState<AnnotationTool>({ type: 'highlight', color: 'yellow' });
  const [annotationCount, setAnnotationCount] = useState(0);

  const handleClearAnnotations = () => {
    setAnnotationCount(0);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">PDF Annotation System Demo</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Annotation Toolbar</h2>
          <p className="text-slate-600 mb-4">
            This toolbar provides all the annotation tools for the PDF viewer:
          </p>
          
          <AnnotationToolbar
            tool={tool}
            onToolChange={setTool}
            onClearAnnotations={handleClearAnnotations}
            annotationCount={annotationCount}
          />
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Current Tool:</h3>
            <div className="text-sm text-slate-600">
              <p><strong>Type:</strong> {tool.type}</p>
              {tool.color && <p><strong>Color:</strong> {tool.color}</p>}
              {tool.alignment && <p><strong>Alignment:</strong> {tool.alignment}</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Features Implemented</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">🎨 Highlighting</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Yellow, blue, orange, and purple colors</li>
                <li>• Click and drag to create highlights</li>
                <li>• Keyboard shortcut: H</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">📝 Sticky Notes</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Click to add yellow sticky notes</li>
                <li>• Editable text content</li>
                <li>• Keyboard shortcut: N</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">📄 Text Annotations</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Left, center, and right alignment</li>
                <li>• Editable text content</li>
                <li>• Keyboard shortcut: T</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">💾 Persistence</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Auto-save to localStorage</li>
                <li>• Per-paper annotation storage</li>
                <li>• Clear all annotations option</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">How to Use</h2>
          <ol className="text-sm text-slate-600 space-y-2">
            <li>1. Open a PDF in the viewer</li>
            <li>2. Click the annotation toggle button (📌) in the header</li>
            <li>3. Select your annotation tool from the toolbar</li>
            <li>4. For highlights: Click and drag to select text</li>
            <li>5. For sticky notes/text: Click where you want to place the annotation</li>
            <li>6. Type your content and press Enter or click outside to save</li>
            <li>7. Click the × button on any annotation to delete it</li>
            <li>8. Use the clear button to remove all annotations</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


