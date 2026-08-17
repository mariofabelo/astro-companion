import { NextRequest, NextResponse } from 'next/server';

// Get ADS API token from environment
function getADSToken(): string | null {
  const token = process.env.ADS_API_TOKEN;
  if (!token) {
    console.warn('ADS_API_TOKEN environment variable is not set. Some features may be limited.');
    return null;
  }
  return token;
}

// Get PDF URL using ADS resolver API
async function getADSPDFUrl(bibcode: string): Promise<string | null> {
  const token = getADSToken();
  
  if (!token) {
    console.log('ADS API token not available, using fallback PDF URL construction');
    return null;
  }
  
  console.log(`Attempting to get PDF URL for bibcode: ${bibcode} with token: ${token.substring(0, 10)}...`);
  
  try {
    // Try to get publisher PDF first, then preprint PDF
    const linkTypes = ['pub_pdf', 'eprint_pdf', 'author_pdf', 'ads_pdf'];
    
    for (const linkType of linkTypes) {
      const url = `https://api.adsabs.harvard.edu/v1/resolver/${bibcode}/${linkType}`;
      console.log(`Trying ${linkType} for ${bibcode}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Response status for ${linkType}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Response data for ${linkType}:`, data);
        
        // Handle different possible response formats
        if (data.links && Array.isArray(data.links) && data.links.length > 0) {
          console.log(`Found PDF URL via ${linkType}:`, data.links[0].url);
          // Check if this is a direct publisher URL that might have access issues
          const foundUrl = data.links[0].url;
          if (foundUrl && !foundUrl.includes('adsabs.harvard.edu') && !foundUrl.includes('arxiv.org')) {
            // This is likely a direct publisher URL that might have access restrictions
            // Return the ADS gateway URL instead for better access
            const gatewayUrl = `https://ui.adsabs.harvard.edu/link_gateway/${bibcode}/PUB_PDF`;
            console.log(`Converting direct publisher URL to ADS gateway URL: ${gatewayUrl}`);
            return gatewayUrl;
          }
          return foundUrl;
        } else if (data.url) {
          console.log(`Found PDF URL via ${linkType}:`, data.url);
          const foundUrl = data.url;
          if (foundUrl && !foundUrl.includes('adsabs.harvard.edu') && !foundUrl.includes('arxiv.org')) {
            const gatewayUrl = `https://ui.adsabs.harvard.edu/link_gateway/${bibcode}/PUB_PDF`;
            console.log(`Converting direct publisher URL to ADS gateway URL: ${gatewayUrl}`);
            return gatewayUrl;
          }
          return foundUrl;
        } else if (data.link) {
          console.log(`Found PDF URL via ${linkType}:`, data.link);
          return data.link;
        } else if (data.service) {
          console.log(`Found PDF URL via ${linkType}:`, data.service);
          return data.service;
        } else if (typeof data === 'string') {
          console.log(`Found PDF URL via ${linkType}:`, data);
          return data;
        }
      } else {
        console.log(`No PDF available for ${linkType}: ${response.status} ${response.statusText}`);
      }
    }
    
    console.log('No PDF URL found via any link type');
    return null;
  } catch (error) {
    console.error('ADS resolver error:', error);
    return null;
  }
}

// Scrape PDF links from ADS abstract page
async function scrapeADSPDFLinks(bibcode: string): Promise<string | null> {
  try {
    const abstractUrl = `https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`;
    console.log(`Scraping PDF links from: ${abstractUrl}`);
    
    const response = await fetch(abstractUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AstroCompanion/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch abstract page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Look for PDF links in the Full Text section
    // ADS typically has links like:
    // - Publisher PDF: https://iopscience.iop.org/article/10.3847/2041-8213/ace32c/pdf
    // - Preprint PDF: https://arxiv.org/pdf/2306.11807
    // - ADS Gateway links: /link_gateway/2023ApJ...951L..48B/PUB_PDF
    
    // First, try to find ADS gateway links (relative URLs that need to be converted to absolute)
    const adsGatewayMatch = html.match(/href="(\/link_gateway\/[^"]*\/PUB_PDF)"/);
    if (adsGatewayMatch) {
      const relativeUrl = adsGatewayMatch[1];
      const absoluteUrl = `https://ui.adsabs.harvard.edu${relativeUrl}`;
      console.log(`Found ADS gateway PDF link: ${absoluteUrl}`);
      return absoluteUrl;
    }
    
    // Try to find publisher PDF first (usually more reliable)
    const publisherPdfMatch = html.match(/href="([^"]*\.pdf[^"]*)"/g);
    if (publisherPdfMatch) {
      for (const match of publisherPdfMatch) {
        const url = match.replace(/href="([^"]*)"/, '$1');
        if (url.includes('.pdf') && !url.includes('adsabs.harvard.edu')) {
          console.log(`Found publisher PDF: ${url}`);
          return url;
        }
      }
    }
    
    // Try to find arXiv PDF (Preprint PDF)
    const arxivPdfMatch = html.match(/href="(https:\/\/arxiv\.org\/pdf\/[^"]*)"/);
    if (arxivPdfMatch) {
      console.log(`Found arXiv PDF: ${arxivPdfMatch[1]}`);
      return arxivPdfMatch[1];
    }
    
    // Try to find any other PDF links
    const anyPdfMatch = html.match(/href="(https:\/\/[^"]*\.pdf[^"]*)"/);
    if (anyPdfMatch) {
      console.log(`Found PDF: ${anyPdfMatch[1]}`);
      return anyPdfMatch[1];
    }
    
    console.log('No PDF links found in abstract page');
    return null;
  } catch (error) {
    console.error('Error scraping ADS PDF links:', error);
    return null;
  }
}

// Enhanced function to get PDF URL with arXiv prioritization
async function getADSPDFUrlEnhanced(bibcode: string): Promise<{ pdfUrl: string | null; fallbackToArxiv: boolean; arxivPaper?: any }> {
  try {
    // ALWAYS try arXiv first - prioritize arXiv over ADS PDF
    console.log(`Prioritizing arXiv search for ${bibcode}`);
    try {
      const arxivResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/ads/arxiv-fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bibcode }),
      });

      if (arxivResponse.ok) {
        const arxivData = await arxivResponse.json();
        if (arxivData.success && arxivData.arxivPaper) {
          console.log(`✅ Found arXiv paper for ${bibcode}: ${arxivData.arxivPaper.url_pdf}`);
          console.log(`📄 arXiv title: ${arxivData.arxivPaper.title}`);
          return { 
            pdfUrl: arxivData.arxivPaper.url_pdf, 
            fallbackToArxiv: true, 
            arxivPaper: arxivData.arxivPaper 
          };
        }
      }
    } catch (arxivError) {
      console.error('arXiv search failed:', arxivError);
    }

    // Only if arXiv is not available, try ADS methods
    console.log(`No arXiv equivalent found for ${bibcode}, trying ADS PDF methods`);
    
    // Try the standard API approach
    const apiUrl = await getADSPDFUrl(bibcode);
    if (apiUrl) {
      console.log(`Using ADS API PDF for ${bibcode}: ${apiUrl}`);
      return { pdfUrl: apiUrl, fallbackToArxiv: false };
    }

    // If API fails, try to scrape the ADS abstract page for PDF links
    console.log(`ADS API failed, attempting to scrape PDF links from ADS abstract page for ${bibcode}`);
    const scrapedUrl = await scrapeADSPDFLinks(bibcode);
    if (scrapedUrl) {
      console.log(`Using scraped ADS PDF for ${bibcode}: ${scrapedUrl}`);
      return { pdfUrl: scrapedUrl, fallbackToArxiv: false };
    }

    console.log(`No PDF available for ${bibcode} via any method`);
    return { pdfUrl: null, fallbackToArxiv: false };
  } catch (error) {
    console.error('Enhanced ADS PDF URL resolution failed:', error);
    return { pdfUrl: null, fallbackToArxiv: false };
  }
}

// Validate ADS bibcode format
function isValidADSBibcode(bibcode: string): boolean {
  // ADS bibcodes typically follow patterns like: 2023ApJ...951L..48B, 2023MNRAS.435.1904M, etc.
  // They start with 4 digits (year) followed by letters and dots
  const bibcodeRegex = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/;
  return bibcodeRegex.test(bibcode);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bibcode = searchParams.get('bibcode');
    
    if (!bibcode) {
      return NextResponse.json(
        { error: 'bibcode parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate bibcode format
    if (!isValidADSBibcode(bibcode)) {
      console.log(`Invalid bibcode format: ${bibcode} - skipping PDF resolution`);
      return NextResponse.json({
        bibcode,
        pdfUrl: null,
        success: false,
        error: 'Invalid bibcode format'
      });
    }
    
    console.log(`Resolving ADS PDF URL for bibcode: ${bibcode}`);
    
    const result = await getADSPDFUrlEnhanced(bibcode);
    
    // For testing: if we get a direct publisher URL, convert it to ADS gateway URL
    let finalPdfUrl = result.pdfUrl;
    if (result.pdfUrl && !result.pdfUrl.includes('adsabs.harvard.edu') && !result.pdfUrl.includes('arxiv.org')) {
      finalPdfUrl = `https://ui.adsabs.harvard.edu/link_gateway/${bibcode}/PUB_PDF`;
      console.log(`Converting direct publisher URL to ADS gateway URL: ${finalPdfUrl}`);
    }
    
    return NextResponse.json({
      bibcode,
      pdfUrl: finalPdfUrl,
      success: !!finalPdfUrl,
      fallbackToArxiv: result.fallbackToArxiv,
      arxivPaper: result.arxivPaper || null,
      source: result.fallbackToArxiv ? 'arxiv' : 'ads'
    });
    
  } catch (error) {
    console.error('Error resolving ADS PDF URL:', error);
    return NextResponse.json(
      { error: 'Failed to resolve PDF URL' },
      { status: 500 }
    );
  }
}