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

export interface ADSSearchResponse {
  response: {
    docs: ADSPaper[]
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
      url_pdf: doc.url?.find(url => url.includes('.pdf'))
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

export function isValidBibcode(bibcode: string): boolean {
  const bibcodeRegex = /^\d{4}[A-Za-z]+\d{4}[A-Za-z]/
  return bibcodeRegex.test(bibcode)
}
