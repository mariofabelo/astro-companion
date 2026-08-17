'use client';

import { useState } from 'react';
import { AnnotationTool, AnnotationType, HighlightColor, TextAlignment } from '@/types/annotations';

interface AnnotationToolbarProps {
  tool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  onClearAnnotations: () => void;
  annotationCount: number;
}

export default function AnnotationToolbar({ 
  tool, 
  onToolChange, 
  onClearAnnotations, 
  annotationCount 
}: AnnotationToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAlignmentPicker, setShowAlignmentPicker] = useState(false);

  const highlightColors: { color: HighlightColor; name: string; bgClass: string }[] = [
    { color: 'yellow', name: 'Yellow', bgClass: 'bg-yellow-300' },
    { color: 'blue', name: 'Blue', bgClass: 'bg-blue-300' },
    { color: 'orange', name: 'Orange', bgClass: 'bg-orange-300' },
    { color: 'purple', name: 'Purple', bgClass: 'bg-purple-300' },
  ];

  const textAlignments: { alignment: TextAlignment; name: string; icon: string }[] = [
    { alignment: 'left', name: 'Left', icon: 'M3 6h18M3 12h18M3 18h18' },
    { alignment: 'center', name: 'Center', icon: 'M4 6h16M4 12h16M4 18h16' },
    { alignment: 'right', name: 'Right', icon: 'M21 6H3M21 12H3M21 18H3' },
  ];

  const handleToolSelect = (type: AnnotationType) => {
    onToolChange({ 
      type, 
      color: type === 'highlight' ? (tool.color || 'yellow') : undefined,
      alignment: type === 'text' ? (tool.alignment || 'left') : undefined
    });
  };

  const handleColorSelect = (color: HighlightColor) => {
    onToolChange({ ...tool, color });
    setShowColorPicker(false);
  };

  const handleAlignmentSelect = (alignment: TextAlignment) => {
    onToolChange({ ...tool, alignment });
    setShowAlignmentPicker(false);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        {/* Highlight Tool */}
        <button
          onClick={() => handleToolSelect('highlight')}
          className={`p-2 rounded-lg transition-colors ${
            tool.type === 'highlight' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Highlight text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>

        {/* Sticky Note Tool */}
        <button
          onClick={() => handleToolSelect('sticky-note')}
          className={`p-2 rounded-lg transition-colors ${
            tool.type === 'sticky-note' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Add sticky note"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Text Tool */}
        <button
          onClick={() => handleToolSelect('text')}
          className={`p-2 rounded-lg transition-colors ${
            tool.type === 'text' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Add text annotation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Color Picker for Highlights */}
      {tool.type === 'highlight' && (
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Select highlight color"
          >
            <div className={`w-4 h-4 rounded ${highlightColors.find(c => c.color === tool.color)?.bgClass || 'bg-yellow-300'}`}></div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              <div className="flex gap-2">
                {highlightColors.map(({ color, name, bgClass }) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      tool.color === color ? 'border-slate-400' : 'border-slate-200'
                    } ${bgClass}`}
                    title={name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alignment Picker for Text */}
      {tool.type === 'text' && (
        <div className="relative">
          <button
            onClick={() => setShowAlignmentPicker(!showAlignmentPicker)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Select text alignment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={textAlignments.find(a => a.alignment === tool.alignment)?.icon || textAlignments[0].icon} />
            </svg>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAlignmentPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              <div className="flex flex-col gap-1">
                {textAlignments.map(({ alignment, name, icon }) => (
                  <button
                    key={alignment}
                    onClick={() => handleAlignmentSelect(alignment)}
                    className={`flex items-center gap-2 p-2 rounded hover:bg-slate-100 text-sm ${
                      tool.alignment === alignment ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
                    }`}
                    title={name}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annotation Count */}
      {annotationCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Clear Annotations */}
      {annotationCount > 0 && (
        <button
          onClick={onClearAnnotations}
          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          title="Clear all annotations"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Close pickers when clicking outside */}
      {(showColorPicker || showAlignmentPicker) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowColorPicker(false);
            setShowAlignmentPicker(false);
          }}
        />
      )}
    </div>
  );
}


