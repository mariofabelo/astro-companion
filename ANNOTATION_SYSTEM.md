# PDF Annotation System

A comprehensive notetaking system for the PDF viewer with highlighting, sticky notes, and text annotations.

## Features

### 🎨 Highlighting
- **Colors**: Yellow, blue, orange, and purple
- **Usage**: Click and drag to select text areas
- **Keyboard Shortcut**: `H`
- **Persistence**: Automatically saved per paper

### 📝 Sticky Notes
- **Appearance**: Yellow sticky note with fold effect
- **Usage**: Click anywhere on the PDF to place
- **Editing**: Click to edit text content
- **Keyboard Shortcut**: `N`
- **Persistence**: Automatically saved per paper

### 📄 Text Annotations
- **Alignment**: Left, center, and right alignment options
- **Usage**: Click anywhere on the PDF to place
- **Editing**: Click to edit text content
- **Keyboard Shortcut**: `T`
- **Persistence**: Automatically saved per paper

## Components

### `AnnotationToolbar`
- Tool selection (highlight, sticky note, text)
- Color picker for highlights
- Alignment picker for text annotations
- Annotation count display
- Clear all annotations button

### `PDFAnnotationOverlay`
- Handles mouse interactions for creating annotations
- Renders annotation overlays on PDF content
- Manages annotation editing and deletion
- Provides visual feedback during drawing

### `useAnnotations` Hook
- Manages annotation state
- Handles persistence to localStorage
- Provides CRUD operations for annotations
- Filters annotations by page number

## Usage

1. **Open PDF**: Click "Open PDF" on any paper
2. **Enable Annotations**: Click the annotation toggle button (📌) in the header
3. **Select Tool**: Choose from highlight, sticky note, or text tools
4. **Create Annotations**:
   - **Highlight**: Click and drag to select text areas
   - **Sticky Note**: Click to place, then type your note
   - **Text**: Click to place, then type your annotation
5. **Edit**: Click any annotation to edit its content
6. **Delete**: Click the × button on any annotation
7. **Clear All**: Use the clear button in the toolbar

## Keyboard Shortcuts

- `H` - Switch to highlight tool
- `N` - Switch to sticky note tool
- `T` - Switch to text annotation tool
- `←` `→` - Navigate pages
- `+` `-` - Zoom in/out
- `0` - Reset zoom
- `Ctrl+F` - Toggle fullscreen
- `Esc` - Close PDF viewer

## Data Structure

### Annotation Types

```typescript
type AnnotationType = 'highlight' | 'sticky-note' | 'text';
type HighlightColor = 'yellow' | 'blue' | 'orange' | 'purple';
type TextAlignment = 'left' | 'center' | 'right';

interface BaseAnnotation {
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
```

### Highlight Annotation
```typescript
interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  color: HighlightColor;
  text?: string; // Selected text that was highlighted
}
```

### Sticky Note Annotation
```typescript
interface StickyNoteAnnotation extends BaseAnnotation {
  type: 'sticky-note';
  content: string;
  isEditing?: boolean;
}
```

### Text Annotation
```typescript
interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  alignment: TextAlignment;
  fontSize?: number;
  color?: string;
  isEditing?: boolean;
}
```

## Persistence

- Annotations are automatically saved to `localStorage`
- Each paper has its own annotation storage key: `annotations-${paperId}`
- Annotations persist across browser sessions
- No server-side storage required

## Integration

The annotation system is fully integrated into the `PDFPopupViewer` component:

1. **State Management**: Uses the `useAnnotations` hook
2. **UI Integration**: Annotation toolbar in header, overlay on PDF content
3. **Event Handling**: Mouse events for creating and editing annotations
4. **Keyboard Support**: Full keyboard shortcut support

## Future Enhancements

- Export annotations to PDF
- Import/export annotation files
- Collaborative annotations
- Annotation search and filtering
- Different annotation shapes
- Annotation categories/tags
- Undo/redo functionality


