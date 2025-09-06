# Search Papers Flow Implementation

This document describes the new search papers functionality that has been implemented.

## Overview

The search papers flow now provides a complete research workflow where users can:
1. Search for papers using arXiv and ADS APIs
2. Select papers from search results
3. Add papers to existing research spaces or create new ones
4. View papers in an interactive canvas with zoom/pan functionality
5. Open PDFs in a popup viewer with navigation controls

## Components

### 1. PaperSearchResults.tsx
- Modal component that displays search results
- Allows users to select papers individually or all at once
- Provides options to add papers to existing spaces or create new spaces
- Handles space selection and creation workflows

### 2. PaperCanvas.tsx
- Interactive canvas for displaying paper previews
- Supports zoom, pan, and drag operations
- Paper nodes can be moved around and selected
- Double-click to open PDF viewer, single click to show details

### 3. PaperIdentificationPanel.tsx
- Side panel that shows detailed paper information
- Displays title, authors, abstract, metadata
- Provides buttons to open PDF or view online
- Can be toggled on/off

### 4. PDFPopupViewer.tsx
- Full-screen PDF viewer with navigation controls
- Supports page navigation, zoom, and fullscreen
- Keyboard shortcuts for navigation
- Handles PDF loading errors gracefully

### 5. ResearchSpaceView.tsx
- Main view for a research space
- Combines canvas and identification panel
- Manages paper selection and PDF viewing
- Handles space updates

### 6. MainPage.tsx (Updated)
- Modified to use the new search flow
- Integrates all components together
- Manages research spaces and view modes
- Handles search mutations and results

## User Flow

1. **Search**: User enters a search query and clicks "Search Papers"
2. **Results**: Search results are displayed in a modal with selection options
3. **Selection**: User selects papers and chooses to add to existing space or create new one
4. **Space Creation**: If creating new space, user provides a title
5. **Canvas View**: User is redirected to the research space with paper previews
6. **Interaction**: User can zoom, pan, and move paper previews around
7. **Details**: Clicking a paper shows detailed information in the side panel
8. **PDF Viewing**: Double-clicking or using the "Open PDF" button opens the PDF viewer

## Features

### Search & Selection
- Search across arXiv and ADS APIs
- Configurable result count (2, 5, or 10)
- Bulk selection with "Select All" option
- Space management (add to existing or create new)

### Canvas Interaction
- Zoom in/out with mouse wheel
- Pan with Ctrl+drag or middle mouse button
- Drag papers to reposition them
- Visual feedback for selected papers
- Fit to view and reset view controls

### PDF Viewing
- Full-screen PDF viewer
- Page navigation with arrow keys
- Zoom controls with keyboard shortcuts
- Fullscreen toggle
- Error handling for failed PDF loads

### Space Management
- Create new research spaces with custom titles
- Add papers to existing spaces
- Persistent storage in localStorage
- Space selection from sidebar

## Keyboard Shortcuts

### PDF Viewer
- `←` / `→`: Navigate pages
- `+` / `-`: Zoom in/out
- `0`: Reset zoom
- `Ctrl+F`: Toggle fullscreen
- `Esc`: Close viewer

### Canvas
- `Ctrl+drag`: Pan canvas
- `Mouse wheel`: Zoom
- `Double-click`: Open PDF
- `Single click`: Show details

## Technical Details

- Uses React Query for API mutations
- Implements proper error handling
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Modular component architecture
- State management with React hooks

## Future Enhancements

- PDF annotation support
- Paper comparison features
- Export functionality
- Collaborative spaces
- Advanced search filters
- Paper recommendations
