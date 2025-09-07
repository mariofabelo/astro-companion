# Citation Integration for arXiv Papers

## Overview

This document describes the integration of external citation data sources to provide accurate citation counts for arXiv papers, which are not available through the basic arXiv API.

## Problem

Previously, all arXiv papers showed citation counts of 0 because the arXiv API doesn't provide citation information. This made it difficult to assess the impact and relevance of arXiv papers compared to published papers from ADS.

## Solution

We've integrated with the **Semantic Scholar API** to fetch citation counts for arXiv papers. Semantic Scholar is a free, AI-powered research tool that provides comprehensive citation data for academic papers, including arXiv preprints.

## Implementation

### Files Added/Modified

1. **`lib/semantic-scholar.ts`** - New Semantic Scholar API integration
2. **`app/api/search/route.ts`** - Updated to fetch citation counts for arXiv papers
3. **`types/paper.ts`** - Added `arxivId` field for internal citation lookup
4. **`app/api/test-citations/route.ts`** - Test endpoint for citation functionality

### Key Features

- **Batch Processing**: Fetches citation counts for multiple arXiv papers efficiently
- **Rate Limiting**: Respects API limits with delays between batches
- **Error Handling**: Gracefully falls back to 0 citations if Semantic Scholar is unavailable
- **arXiv ID Extraction**: Handles various arXiv ID formats (with/without version numbers, URLs, etc.)

### API Usage

The Semantic Scholar API is free and doesn't require authentication. It provides:

- Citation counts for arXiv papers
- Reference counts
- Influential citation counts
- Additional metadata (venue, fields of study, etc.)

### Testing

You can test the citation functionality using the test endpoint:

```bash
# GET request with comma-separated arXiv IDs
curl "http://localhost:3000/api/test-citations?ids=2301.07041,2010.11929"

# POST request with JSON body
curl -X POST http://localhost:3000/api/test-citations \
  -H "Content-Type: application/json" \
  -d '{"arxivIds": ["2301.07041", "2010.11929"]}'
```

## Benefits

1. **Accurate Citation Data**: arXiv papers now show real citation counts
2. **Better Relevance Scoring**: Papers with higher citations are ranked higher
3. **Improved User Experience**: Users can assess paper impact at a glance
4. **No Additional Cost**: Uses free Semantic Scholar API
5. **Reliable Fallback**: System continues to work even if external API fails

## Future Enhancements

- Consider adding Google Scholar as a backup source
- Implement caching to reduce API calls
- Add citation trend analysis
- Support for other preprint servers (bioRxiv, medRxiv, etc.)

## Rate Limits

Semantic Scholar API has the following limits:
- 100 requests per 5 minutes per IP
- Our implementation processes papers in batches of 5 with 100ms delays
- This should keep us well within the rate limits for normal usage
