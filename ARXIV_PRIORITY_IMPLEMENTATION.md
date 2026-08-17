# arXiv PDF Priority Implementation

## Overview

This implementation modifies the existing ADS download and PDF opening logic to prioritize arXiv PDFs when they are available as fallbacks. When an ADS paper has an arXiv equivalent, the system now automatically uses the arXiv PDF for both downloading and viewing, providing a more reliable user experience.

## Key Changes Made

### 1. Enhanced Download Logic (`lib/download.ts`)

**Updated Functions:**
- `downloadPaper()` - Now logs when arXiv fallback is being used
- `openPaperInNewTab()` - Now logs when arXiv fallback is being used

**Changes:**
- Added logging to track when arXiv fallback PDFs are being used
- Both functions now receive the full API response including `fallbackToArxiv` and `arxivPaper` data
- Enhanced console logging for better debugging

### 2. Enhanced PDF Viewer (`components/PDFPopupViewer.tsx`)

**New State Variables:**
- `isArxivFallback` - Tracks if arXiv fallback is being used
- `arxivFallbackPaper` - Stores arXiv paper metadata

**Visual Enhancements:**
- Added green "arXiv PDF" badge in the header when fallback is active
- Clear visual indication that arXiv version is being displayed
- Maintains all existing PDF viewer functionality

**Logic Updates:**
- Detects when API response includes arXiv fallback data
- Sets appropriate state variables for UI feedback
- Logs arXiv fallback usage for debugging

### 3. Paper Identification Panel (`components/PaperIdentificationPanel.tsx`)

**Already Enhanced:**
- The panel already had arXiv fallback detection and visual indicators
- Works seamlessly with the updated download and PDF viewing logic
- Shows informational notices when arXiv fallback is used

## How It Works

### PDF Resolution Flow:
1. **User Action**: User clicks "Open PDF" or "Download PDF" on an ADS paper
2. **API Call**: System calls `/api/ads/pdf-url` with the paper's bibcode
3. **ADS Resolution**: API attempts to resolve ADS PDF URL
4. **arXiv Fallback**: If ADS PDF fails, API searches for arXiv equivalent
5. **Response**: API returns either ADS PDF URL or arXiv PDF URL with metadata
6. **UI Update**: Interface shows appropriate visual indicators
7. **Action Execution**: Download/view uses the resolved PDF URL (ADS or arXiv)

### Visual Indicators:
- **Green "arXiv PDF" Badge**: Shows when arXiv fallback is active
- **Informational Notice**: Explains that arXiv version is being used
- **Loading States**: Clear feedback during PDF resolution
- **Console Logging**: Detailed logs for debugging

## Benefits

### 1. **Improved Reliability**
- arXiv PDFs are more accessible than publisher PDFs
- Reduces CAPTCHA and access restriction issues
- Provides consistent PDF access experience

### 2. **Transparent User Experience**
- Clear visual indicators when arXiv version is used
- Users understand which version they're accessing
- No confusion about PDF source

### 3. **Seamless Integration**
- Works with existing download and viewing workflows
- No changes required to user interaction patterns
- Maintains all existing functionality

### 4. **Better Debugging**
- Enhanced logging for troubleshooting
- Clear tracking of fallback usage
- Easy identification of PDF source issues

## Technical Details

### API Response Format:
```json
{
  "bibcode": "2023ApJ...951L..48B",
  "pdfUrl": "https://arxiv.org/pdf/2306.11807.pdf",
  "success": true,
  "fallbackToArxiv": true,
  "arxivPaper": {
    "title": "arXiv Paper Title",
    "authors": ["Author 1", "Author 2"],
    "url_pdf": "https://arxiv.org/pdf/2306.11807.pdf",
    "url_html": "https://arxiv.org/abs/2306.11807"
  }
}
```

### State Management:
- `isArxivFallback`: Boolean indicating fallback usage
- `arxivFallbackPaper`: Object containing arXiv paper metadata
- `pdfUrl`: The actual PDF URL to use (ADS or arXiv)

## Testing

Use the provided test script to verify functionality:

```bash
node test-arxiv-fallback.js
```

The test will:
1. Test arXiv fallback API endpoint
2. Test PDF URL resolution with fallback
3. Verify that arXiv PDFs are prioritized when available

## Configuration

No additional configuration required. The system uses existing environment variables:
- `ADS_API_TOKEN`: For ADS API access
- `NEXT_PUBLIC_BASE_URL`: For internal API calls

## Future Enhancements

- **Caching**: Cache arXiv search results for better performance
- **User Preferences**: Allow users to prefer arXiv or publisher PDFs
- **Batch Processing**: Handle multiple papers simultaneously
- **Additional Sources**: Extend fallback to other preprint servers


