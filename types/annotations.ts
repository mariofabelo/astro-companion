export type AnnotationType = 'highlight' | 'sticky-note' | 'text';

export type HighlightColor = 'yellow' | 'blue' | 'orange' | 'purple';

export type TextAlignment = 'left' | 'center' | 'right';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number; // Position as percentage of page width
  y: number; // Position as percentage of page height
  width?: number; // For highlights and text boxes
  height?: number; // For highlights and text boxes
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  color: HighlightColor;
  text?: string; // Selected text that was highlighted
}

export interface StickyNoteAnnotation extends BaseAnnotation {
  type: 'sticky-note';
  content: string;
  isEditing?: boolean;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  alignment: TextAlignment;
  fontSize?: number;
  color?: string;
  isEditing?: boolean;
}

export type Annotation = HighlightAnnotation | StickyNoteAnnotation | TextAnnotation;

export interface AnnotationTool {
  type: AnnotationType;
  color?: HighlightColor;
  alignment?: TextAlignment;
}

export interface AnnotationState {
  tool: AnnotationTool;
  annotations: Annotation[];
  selectedAnnotation: string | null;
  isDrawing: boolean;
}


