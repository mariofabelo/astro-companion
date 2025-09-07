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
function getADSToken(): string {
  const token = process.env.ADS_API_TOKEN
  if (!token) {
    throw new Error('ADS_API_TOKEN environment variable is required')
  }
  return token
}

// Search papers using ADS API
export async function searchADSPapers(params: ADSSearchParams): Promise<ADSPaper[]> {
  try {
    const token = getADSToken()
    
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
    
    // Get proper PDF URL using resolver API
    const pdfUrl = await getADSPDFUrl(bibcode)
    
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
  
  try {
    // Try to get publisher PDF first, then preprint PDF
    const linkTypes = ['pub_pdf', 'eprint_pdf', 'author_pdf', 'ads_pdf']
    
    for (const linkType of linkTypes) {
      const url = `https://api.adsabs.harvard.edu/v1/resolver/${bibcode}/${linkType}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Handle different possible response formats
        if (data.links && Array.isArray(data.links) && data.links.length > 0) {
          return data.links[0].url
        } else if (data.url) {
          return data.url
        } else if (typeof data === 'string') {
          return data
        }
      }
    }
    
    // If no PDF found via API, try fallback
    return constructADSPDFUrl(bibcode)
  } catch (error) {
    console.error('ADS resolver error:', error)
    
    // Fallback: try to construct PDF URL directly
    return constructADSPDFUrl(bibcode)
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
