# ADS (Astrophysics Data System) Integration

This document describes the ADS API integration for the Astro Research Companion.

## Overview

The application now supports searching papers from both arXiv and ADS (Astrophysics Data System). ADS provides access to a comprehensive database of astronomy and astrophysics literature with citation counts and metadata.

## Setup

### 1. Get ADS API Token

1. Go to [ADS (Astrophysics Data System)](https://ui.adsabs.harvard.edu/)
2. Create an account and log in
3. Go to your user profile settings
4. Click "Generate a new key" to create an API token
5. Copy the token

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# ADS API Configuration
ADS_API_TOKEN=your_ads_api_token_here
NEXT_PUBLIC_ENABLE_ADS=true
```

## Features

### Multi-Source Search
- Search both arXiv and ADS simultaneously
- Toggle between sources in the search interface
- Combined results from multiple sources

### ADS-Specific Features
- Citation counts for papers
- Journal information
- DOI links
- Direct links to ADS abstracts
- PDF links when available

### Rate Limiting
ADS API has rate limits (typically 5000 requests per day). The application handles rate limit headers and provides appropriate error messages.

## API Implementation

### Search Function
```typescript
import { searchADSPapers } from '@/lib/ads';

const results = await searchADSPapers({
  query: 'exoplanet',
  maxResults: 10
});
```

### Paper Format
ADS papers are transformed to match the application's Paper interface:

```typescript
interface Paper {
  id: string;              // "ads:bibcode"
  source: "ads";
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  url_html: string;        // ADS abstract URL
  url_pdf?: string;        // PDF URL if available
  citations: number;       // Citation count
  journal?: string;        // Journal name
  doi?: string;           // DOI if available
}
```

## Usage

1. **Enable ADS**: Set `NEXT_PUBLIC_ENABLE_ADS=true` in your environment
2. **Search**: Use the search interface and select "ADS" as a source
3. **Results**: Papers from ADS will show with citation counts and journal information
4. **Links**: Click the external link icon to view papers on ADS

## Error Handling

The application gracefully handles:
- Missing API token
- Rate limit exceeded
- Network errors
- Invalid responses

If ADS search fails, the application continues with other sources (e.g., arXiv).

## Rate Limits

ADS API rate limits are displayed in response headers:
- `X-RateLimit-Limit`: Daily query limit
- `X-RateLimit-Remaining`: Queries remaining
- `X-RateLimit-Reset`: UTC timestamp when limits reset

## Testing

To test the integration:

1. Set up your ADS API token
2. Enable ADS in environment variables
3. Search for papers using both arXiv and ADS sources
4. Verify that ADS papers show citation counts and proper links

## Troubleshooting

### Common Issues

1. **"ADS_API_TOKEN environment variable is required"**
   - Make sure you've added the token to your `.env.local` file
   - Restart your development server after adding the token

2. **"ADS API error: 401"**
   - Check that your API token is valid
   - Regenerate the token if needed

3. **"ADS API error: 429"**
   - You've exceeded the rate limit
   - Wait until the limit resets (usually at midnight UTC)

4. **ADS button is disabled**
   - Make sure `NEXT_PUBLIC_ENABLE_ADS=true` is set
   - Restart your development server

### Getting Help

For ADS API issues:
- Check the [ADS API documentation](https://github.com/adsabs/adsabs-dev-api)
- Contact ADS support at `adshelp@cfa.harvard.edu`

For application issues:
- Check the console for error messages
- Verify environment variables are set correctly
