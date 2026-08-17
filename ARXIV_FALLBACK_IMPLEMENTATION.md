# arXiv Fallback Implementation

## Overview

This implementation provides an automatic fallback mechanism for ADS papers that fail to load due to CAPTCHA or access restrictions. When an ADS PDF is not accessible, the system automatically searches for an equivalent arXiv paper and provides that PDF instead.

## Features

### 1. Automatic arXiv Search
- When ADS PDF resolution fails, the system automatically searches arXiv for matching papers
- Uses intelligent matching based on title similarity, author overlap, and abstract keywords
- Prioritizes papers with high similarity scores (>30% threshold)

### 2. Smart Paper Matching
- **Title Similarity (60% weight)**: Compares meaningful words between ADS and arXiv titles
- **Author Similarity (30% weight)**: Matches author last names between papers
- **Abstract Similarity (10% weight)**: Compares technical keywords in abstracts
- **Direct arXiv ID**: If ADS paper already has an arXiv ID, uses that directly

### 3. User-Friendly Interface
- Clear visual indicators when arXiv fallback is being used
- Informational notice showing the arXiv paper details
- Loading states during PDF resolution
- Green "arXiv PDF" badge to indicate fallback usage

## Implementation Details

### API Endpoints

#### `/api/ads/arxiv-fallback` (POST)
- Searches arXiv for papers matching an ADS paper
- Input: `{ bibcode: string }`
- Output: `{ success: boolean, arxivPaper?: object, adsPaper?: object }`

#### `/api/ads/pdf-url` (GET) - Enhanced
- Now includes arXiv fallback in the resolution process
- Returns additional fields: `fallbackToArxiv`, `arxivPaper`
- Maintains backward compatibility

### Components Updated

#### `PaperIdentificationPanel.tsx`
- Added state management for arXiv fallback
- Visual indicators for fallback usage
- Loading states during PDF resolution
- Informational notices for users

### Key Functions

#### `searchArXivForPaper(adsPaper)`
- Searches arXiv using title and author information
- Calculates similarity scores for matching
- Returns best matching arXiv paper or null

#### `calculateSimilarity(adsPaper, arxivPaper)`
- Implements weighted similarity scoring
- Considers title, author, and abstract overlap
- Returns score between 0 and 1

## Usage Flow

1. **User opens ADS paper**: System attempts to resolve PDF URL
2. **ADS PDF fails**: If CAPTCHA or access issues occur
3. **arXiv search triggered**: System searches for equivalent arXiv paper
4. **Match found**: arXiv PDF is provided with clear user notification
5. **User experience**: Seamless access to paper content via arXiv

## Benefits

- **Improved accessibility**: Users can access papers even when ADS has issues
- **Transparent fallback**: Clear indication when arXiv version is used
- **Intelligent matching**: High-quality matches based on multiple criteria
- **User-friendly**: No additional user action required

## Testing

Use the provided test script to verify functionality:

```bash
node test-arxiv-fallback.js
```

## Configuration

The system uses the following environment variables:
- `ADS_API_TOKEN`: For ADS API access
- `NEXT_PUBLIC_BASE_URL`: For internal API calls (defaults to localhost:3000)

## Future Enhancements

- Caching of arXiv search results
- User preference for fallback behavior
- Additional fallback sources (e.g., Semantic Scholar)
- Batch processing for multiple papers


