// ADS API integration for fetching paper metadata and search

export interface ADSPaper {
  bibcode: string
  title: string
  authors: string[]
  abstract: string
  pubdate: string
  doi?: string
  arxiv_id?: string
  citation_count?: number
  year?: number
  journal?: string
  url_html?: string
  url_pdf?: string
}

// Raw ADS API response interface
export interface ADSRawPaper {
  bibcode: string
  title?: string[]
  author?: string[]
  abstract?: string
  pubdate?: string
  doi?: string[]
  arxiv_id?: string[]
  citation_count?: number
  year?: number
  pub?: string
  url?: string[]
}

export interface ADSSearchResponse {
  response: {
    docs: ADSRawPaper[]
    numFound: number
  }
}

export interface ADSSearchParams {
  query: string
  maxResults: number
  sort?: string
  fl?: string[]
}

// Get ADS API token from environment
function getADSToken(): string | null {
  const token = process.env.ADS_API_TOKEN
  if (!token) {
    console.warn('ADS_API_TOKEN environment variable is not set. Some features may be limited.')
    return null
  }
  return token
}

// Search papers using ADS API
export async function searchADSPapers(params: ADSSearchParams): Promise<ADSPaper[]> {
  try {
    const token = getADSToken()
    
    if (!token) {
      throw new Error('ADS API token not configured. Please set ADS_API_TOKEN environment variable.')
    }
    
    // Default fields to retrieve
    const fields = params.fl || [
      'bibcode',
      'title',
      'author',
      'abstract',
      'pubdate',
      'doi',
      'arxiv_id',
      'citation_count',
      'year',
      'pub',
      'url'
    ]
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      q: params.query,
      rows: params.maxResults.toString(),
      fl: fields.join(','),
      sort: params.sort || 'score desc'
    })
    
    const url = `https://api.adsabs.harvard.edu/v1/search/query?${queryParams}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`ADS API error: ${response.status} ${response.statusText}`)
    }
    
    const data: ADSSearchResponse = await response.json()
    
    // Transform ADS response to our format
    return data.response.docs.map(doc => ({
      bibcode: doc.bibcode,
      title: doc.title?.[0] || '',
      authors: doc.author || [],
      abstract: doc.abstract || '',
      pubdate: doc.pubdate || '',
      doi: doc.doi?.[0],
      arxiv_id: doc.arxiv_id?.[0],
      citation_count: doc.citation_count || 0,
      year: doc.year || (doc.pubdate ? parseInt(doc.pubdate.slice(0, 4)) : undefined),
      journal: doc.pub || '',
      url_html: doc.url?.[0] || `https://ui.adsabs.harvard.edu/abs/${doc.bibcode}/abstract`,
      url_pdf: doc.url?.find((url: string) => url.includes('.pdf')) // Will be updated on-demand when opening PDF
    }))
    
  } catch (error) {
    console.error('ADS search error:', error)
    throw error
  }
}

// Fetch a specific paper by bibcode
export async function fetchADSPaper(bibcode: string): Promise<ADSPaper | null> {
  try {
    const token = getADSToken()
    if (!token) {
      throw new Error('ADS API token not configured')
    }
    
    const results = await searchADSPapers({
      query: `bibcode:${bibcode}`,
      maxResults: 1
    })
    
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error('ADS fetch error:', error)
    return null
  }
}

// Fetch PDF URL for a specific paper by bibcode (useful for individual paper requests)
export async function fetchADSPaperWithPDF(bibcode: string): Promise<ADSPaper | null> {
  try {
    const paper = await fetchADSPaper(bibcode)
    if (!paper) return null
    
    // Get proper PDF URL using enhanced resolver API
    const pdfUrl = await getADSPDFUrlEnhanced(bibcode)
    
    return {
      ...paper,
      url_pdf: pdfUrl || paper.url_pdf
    }
  } catch (error) {
    console.error('ADS fetch with PDF error:', error)
    return null
  }
}

// ADS resolver API response types
export interface ADSLink {
  url: string
  link_type: string
  title: string
}

export interface ADSResolverResponse {
  links: ADSLink[]
}

// Alternative response format that might be returned
export interface ADSResolverResponseAlt {
  url: string
  link_type: string
  title: string
}

// Get PDF URL using ADS resolver API
export async function getADSPDFUrl(bibcode: string): Promise<string | null> {
  // Check if API token is available
  const token = process.env.ADS_API_TOKEN
  
  if (!token) {
    console.log('ADS API token not available, using fallback PDF URL construction')
    return constructADSPDFUrl(bibcode)
  }
  
  console.log(`Attempting to get PDF URL for bibcode: ${bibcode} with token: ${token.substring(0, 10)}...`)
  
  try {
    // Try to get publisher PDF first, then preprint PDF
    const linkTypes = ['pub_pdf', 'eprint_pdf', 'author_pdf', 'ads_pdf']
    
    for (const linkType of linkTypes) {
      const url = `https://api.adsabs.harvard.edu/v1/resolver/${bibcode}/${linkType}`
      console.log(`Trying ${linkType} for ${bibcode}: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`Response status for ${linkType}: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`Response data for ${linkType}:`, data)
        
        // Handle different possible response formats
        if (data.links && Array.isArray(data.links) && data.links.length > 0) {
          console.log(`Found PDF URL via ${linkType}:`, data.links[0].url)
          // Check if this is a direct publisher URL that might have access issues
          const foundUrl = data.links[0].url
          if (foundUrl && !foundUrl.includes('adsabs.harvard.edu') && !foundUrl.includes('arxiv.org')) {
            // This is likely a direct publisher URL that might have access restrictions
            // Return the ADS gateway URL instead for better access
            const gatewayUrl = `https://ui.adsabs.harvard.edu/link_gateway/${bibcode}/PUB_PDF`
            console.log(`Converting direct publisher URL to ADS gateway URL: ${gatewayUrl}`)
            return gatewayUrl
          }
          return foundUrl
        } else if (data.url) {
          console.log(`Found PDF URL via ${linkType}:`, data.url)
          const foundUrl = data.url
          if (foundUrl && !foundUrl.includes('adsabs.harvard.edu') && !foundUrl.includes('arxiv.org')) {
            const gatewayUrl = `https://ui.adsabs.harvard.edu/link_gateway/${bibcode}/PUB_PDF`
            console.log(`Converting direct publisher URL to ADS gateway URL: ${gatewayUrl}`)
            return gatewayUrl
          }
          return foundUrl
        } else if (data.link) {
          console.log(`Found PDF URL via ${linkType}:`, data.link)
          return data.link
        } else if (data.service) {
          console.log(`Found PDF URL via ${linkType}:`, data.service)
          return data.service
        } else if (typeof data === 'string') {
          console.log(`Found PDF URL via ${linkType}:`, data)
          return data
        }
      } else {
        console.log(`No PDF available for ${linkType}: ${response.status} ${response.statusText}`)
      }
    }
    
    console.log('No PDF URL found via any link type, using fallback')
    // If no PDF found via API, try fallback
    return constructADSPDFUrl(bibcode)
  } catch (error) {
    console.error('ADS resolver error:', error)
    
    // Fallback: try to construct PDF URL directly
    return constructADSPDFUrl(bibcode)
  }
}

// Enhanced function to get PDF URL with multiple fallback strategies
export async function getADSPDFUrlEnhanced(bibcode: string): Promise<string | null> {
  try {
    // First try the standard API approach
    const apiUrl = await getADSPDFUrl(bibcode)
    if (apiUrl) {
      return apiUrl
    }

    // If API fails, try to scrape the ADS abstract page for PDF links
    console.log(`API failed, attempting to scrape PDF links from ADS abstract page for ${bibcode}`)
    return await scrapeADSPDFLinks(bibcode)
  } catch (error) {
    console.error('Enhanced ADS PDF URL resolution failed:', error)
    return null
  }
}

// Scrape PDF links from ADS abstract page
async function scrapeADSPDFLinks(bibcode: string): Promise<string | null> {
  try {
    const abstractUrl = `https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`
    console.log(`Scraping PDF links from: ${abstractUrl}`)
    
    // Use a server-side fetch to avoid CORS issues
    const response = await fetch(abstractUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AstroCompanion/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch abstract page: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Look for PDF links in the Full Text section
    // ADS typically has links like:
    // - Publisher PDF: https://iopscience.iop.org/article/10.3847/2041-8213/ace32c/pdf
    // - Preprint PDF: https://arxiv.org/pdf/2306.11807
    // - ADS Gateway links: /link_gateway/2023ApJ...951L..48B/PUB_PDF
    
    // First, try to find ADS gateway links (relative URLs that need to be converted to absolute)
    const adsGatewayMatch = html.match(/href="(\/link_gateway\/[^"]*\/PUB_PDF)"/)
    if (adsGatewayMatch) {
      const relativeUrl = adsGatewayMatch[1]
      const absoluteUrl = `https://ui.adsabs.harvard.edu${relativeUrl}`
      console.log(`Found ADS gateway PDF link: ${absoluteUrl}`)
      return absoluteUrl
    }
    
    // Try to find publisher PDF first (usually more reliable)
    const publisherPdfMatch = html.match(/href="([^"]*\.pdf[^"]*)"/g)
    if (publisherPdfMatch) {
      for (const match of publisherPdfMatch) {
        const url = match.replace(/href="([^"]*)"/, '$1')
        if (url.includes('.pdf') && !url.includes('adsabs.harvard.edu')) {
          console.log(`Found publisher PDF: ${url}`)
          return url
        }
      }
    }
    
    // Try to find arXiv PDF (Preprint PDF)
    const arxivPdfMatch = html.match(/href="(https:\/\/arxiv\.org\/pdf\/[^"]*)"/)
    if (arxivPdfMatch) {
      console.log(`Found arXiv PDF: ${arxivPdfMatch[1]}`)
      return arxivPdfMatch[1]
    }
    
    // Try to find any other PDF links
    const anyPdfMatch = html.match(/href="(https:\/\/[^"]*\.pdf[^"]*)"/)
    if (anyPdfMatch) {
      console.log(`Found PDF: ${anyPdfMatch[1]}`)
      return anyPdfMatch[1]
    }
    
    console.log('No PDF links found in abstract page')
    return null
  } catch (error) {
    console.error('Error scraping ADS PDF links:', error)
    return null
  }
}

// Fallback function to construct PDF URL directly
function constructADSPDFUrl(bibcode: string): string | null {
  try {
    // Since we can't construct direct PDF URLs without the proper API,
    // we'll return null to indicate no PDF is available
    // This will cause the component to fall back to the original URL
    console.log(`No PDF URL available for bibcode: ${bibcode} (API token required)`)
    return null
  } catch (error) {
    console.error('Error constructing fallback PDF URL:', error)
    return null
  }
}

export function isValidBibcode(bibcode: string): boolean {
  // More flexible bibcode validation - ADS bibcodes can have various formats
  // Examples: 2023ApJ...950L..20M, 2023MNRAS.435.1904M, etc.
  const bibcodeRegex = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/
  return bibcodeRegex.test(bibcode)
}
