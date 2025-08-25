# Astro Research Companion - MVP Implementation

## Overview

This is the MVP implementation of the Astro Research Companion following the detailed implementation plan. The application provides a modern, intuitive interface for searching and exploring astronomical research papers.

## Features Implemented

### ✅ Core MVP Features

1. **Search Functionality**
   - arXiv paper search via API
   - Configurable result count (2, 5, 10 papers)
   - Source selection (arXiv enabled, ADS placeholder)
   - Real-time search with loading states

2. **Paper Display**
   - Beautiful result cards with paper information
   - Title, authors, abstract, and metadata badges
   - Source indicators (arXiv/ADS)
   - External links to paper and PDF

3. **Session Management**
   - Multi-select papers from search results
   - Add selected papers to research session
   - Persistent session storage (localStorage)
   - Session canvas with mind-map style nodes

4. **PDF Integration**
   - PDF.js integration for thumbnail rendering
   - Lazy loading with Intersection Observer
   - Left-side PDF popover viewer
   - Page navigation and zoom controls

5. **Modern UI/UX**
   - Glassmorphism design with starry background
   - Responsive grid layouts
   - Smooth animations and transitions
   - Accessibility features (keyboard navigation, ARIA labels)

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom utilities
- **State Management**: React Query + useState
- **PDF Rendering**: pdf.js
- **Data Fetching**: React Query mutations
- **Validation**: Zod schema validation

## Project Structure

```
astro-companion/
├── app/
│   ├── api/search/route.ts     # arXiv search API
│   ├── layout.tsx              # Root layout with React Query
│   └── page.tsx                # Main application page
├── components/
│   ├── SearchBar.tsx           # Search interface
│   ├── ResultCard.tsx          # Paper result display
│   ├── SelectionTray.tsx       # Multi-select controls
│   ├── SessionCanvas.tsx       # Research session display
│   ├── CanvasNode.tsx          # Individual paper nodes
│   └── PdfPopover.tsx          # PDF viewer popover
├── lib/
│   ├── pdf.ts                  # PDF.js integration
│   └── query-client.ts         # React Query configuration
├── types/
│   └── paper.ts                # TypeScript type definitions
└── styles/
    └── globals.css             # Global styles and utilities
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_ENABLE_ADS=false
```

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   echo "NEXT_PUBLIC_ENABLE_ADS=false" > .env.local
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Open http://localhost:3000

## Usage

1. **Search Papers**: Enter a query in the search bar
2. **Select Sources**: Choose arXiv (ADS coming soon)
3. **Set Result Count**: Choose 2, 5, or 10 results
4. **Browse Results**: View paper cards with details
5. **Add to Session**: Select papers and add to research session
6. **Explore Session**: View papers as mind-map nodes
7. **View PDFs**: Click nodes to open PDF viewer

## Future Enhancements

- [ ] ADS integration with API token
- [ ] Drag-and-drop node arrangement
- [ ] Session sharing and export
- [ ] Advanced filtering and sorting
- [ ] Citation analysis and visualization
- [ ] AI-powered paper summaries
- [ ] Collaborative research sessions

## API Endpoints

### POST /api/search
Search for papers on arXiv.

**Request Body:**
```json
{
  "query": "string (min 2 chars)",
  "maxResults": 2 | 5 | 10,
  "sources": ["arXiv" | "ads"]
}
```

**Response:**
```json
{
  "papers": [
    {
      "id": "arxiv:2401.12345",
      "source": "arxiv",
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "abstract": "Paper abstract...",
      "year": 2024,
      "categories": ["astro-ph.GA"],
      "url_html": "https://arxiv.org/abs/2401.12345",
      "url_pdf": "https://arxiv.org/pdf/2401.12345.pdf"
    }
  ]
}
```

## Performance Features

- **Lazy Loading**: PDF thumbnails load only when visible
- **Caching**: React Query for API response caching
- **Optimized Rendering**: Efficient component updates
- **Memory Management**: Proper cleanup of PDF resources

## Browser Support

- Modern browsers with ES2020+ support
- PDF.js for PDF rendering
- LocalStorage for session persistence
- Intersection Observer for lazy loading
