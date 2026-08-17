'use client';

import { useState, useEffect, useCallback } from 'react';
import { Annotation, AnnotationTool, AnnotationState } from '@/types/annotations';

interface UseAnnotationsProps {
  paperId: string;
}

export function useAnnotations({ paperId }: UseAnnotationsProps) {
  const [state, setState] = useState<AnnotationState>({
    tool: { type: 'highlight', color: 'yellow' },
    annotations: [],
    selectedAnnotation: null,
    isDrawing: false
  });

  // Load annotations from localStorage on mount
  useEffect(() => {
    const savedAnnotations = localStorage.getItem(`annotations-${paperId}`);
    if (savedAnnotations) {
      try {
        const parsed = JSON.parse(savedAnnotations);
        // Convert date strings back to Date objects
        const annotations = parsed.map((ann: any) => ({
          ...ann,
          createdAt: new Date(ann.createdAt),
          updatedAt: new Date(ann.updatedAt)
        }));
        setState(prev => ({ ...prev, annotations }));
      } catch (error) {
        console.error('Failed to load annotations:', error);
      }
    }
  }, [paperId]);

  // Save annotations to localStorage whenever they change
  useEffect(() => {
    if (state.annotations.length > 0) {
      localStorage.setItem(`annotations-${paperId}`, JSON.stringify(state.annotations));
    } else {
      localStorage.removeItem(`annotations-${paperId}`);
    }
  }, [state.annotations, paperId]);

  const setTool = useCallback((tool: AnnotationTool) => {
    setState(prev => ({ ...prev, tool }));
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setState(prev => ({
      ...prev,
      annotations: [...prev.annotations, annotation]
    }));
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setState(prev => ({
      ...prev,
      annotations: prev.annotations.map(ann =>
        ann.id === id ? { ...ann, ...updates } : ann
      )
    }));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      annotations: prev.annotations.filter(ann => ann.id !== id),
      selectedAnnotation: prev.selectedAnnotation === id ? null : prev.selectedAnnotation
    }));
  }, []);

  const clearAllAnnotations = useCallback(() => {
    setState(prev => ({
      ...prev,
      annotations: [],
      selectedAnnotation: null
    }));
  }, []);

  const getAnnotationsForPage = useCallback((pageNumber: number) => {
    return state.annotations.filter(ann => ann.pageNumber === pageNumber);
  }, [state.annotations]);

  const exportAnnotations = useCallback(() => {
    const dataStr = JSON.stringify(state.annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${paperId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state.annotations, paperId]);

  const importAnnotations = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const annotations = JSON.parse(e.target?.result as string);
        // Convert date strings back to Date objects
        const parsedAnnotations = annotations.map((ann: any) => ({
          ...ann,
          createdAt: new Date(ann.createdAt),
          updatedAt: new Date(ann.updatedAt)
        }));
        setState(prev => ({ ...prev, annotations: parsedAnnotations }));
      } catch (error) {
        console.error('Failed to import annotations:', error);
        alert('Failed to import annotations. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    ...state,
    setTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAllAnnotations,
    getAnnotationsForPage,
    exportAnnotations,
    importAnnotations
  };
}


