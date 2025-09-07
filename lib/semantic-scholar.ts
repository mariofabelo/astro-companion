// Semantic Scholar API integration for fetching citation counts

export interface SemanticScholarPaper {
  paperId: string
  title: string
  authors: Array<{
    authorId: string
    name: string
  }>
  abstract?: string
  year?: number
  citationCount?: number
  referenceCount?: number
  influentialCitationCount?: number
  isOpenAccess?: boolean
  openAccessPdf?: {
    url: string
    status: string
  }
  externalIds?: {
    ArXiv?: string
    DOI?: string
    MAG?: string
    ACL?: string
    PubMed?: string
    CorpusId?: number
    DBLP?: string
  }
  url?: string
  venue?: string
  fieldsOfStudy?: string[]
  s2FieldsOfStudy?: Array<{
    category: string
    source: string
  }>
}

export interface SemanticScholarSearchResponse {
  total: number
  offset: number
  next: number
  data: SemanticScholarPaper[]
}

// Search for papers using Semantic Scholar API
export async function searchSemanticScholarPapers(
  query: string, 
  limit: number = 10,
  fields?: string[]
): Promise<SemanticScholarPaper[]> {
  try {
    const defaultFields = [
      'paperId',
      'title', 
      'authors',
      'abstract',
      'year',
      'citationCount',
      'referenceCount',
      'influentialCitationCount',
      'isOpenAccess',
      'openAccessPdf',
      'externalIds',
      'url',
      'venue',
      'fieldsOfStudy',
      's2FieldsOfStudy'
    ]
    
    const fieldsParam = fields ? fields.join(',') : defaultFields.join(',')
    
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fieldsParam}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AstroCompanion/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
    }
    
    const data: SemanticScholarSearchResponse = await response.json()
    return data.data || []
    
  } catch (error) {
    console.error('Semantic Scholar search error:', error)
    throw error
  }
}

// Simple in-memory cache for citation counts
const citationCache = new Map<string, { count: number; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Get paper details by arXiv ID with retry logic
export async function getSemanticScholarPaperByArxivId(arxivId: string, retryCount = 0): Promise<SemanticScholarPaper | null> {
  try {
    // Clean arXiv ID (remove version number if present)
    let cleanArxivId = arxivId.replace(/v\d+$/, '')
    
    // Convert old arXiv format to new format for Semantic Scholar
    // Old format: astro-ph/0409350 -> 0409.350
    if (cleanArxivId.includes('/')) {
      const parts = cleanArxivId.split('/')
      if (parts.length === 2 && parts[1].length === 7) {
        const year = parts[1].substring(0, 2)
        const month = parts[1].substring(2, 4)
        const number = parts[1].substring(4, 7)
        cleanArxivId = `${year}${month}.${number}`
      }
    }
    
    // Check cache first
    const cached = citationCache.get(cleanArxivId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached citation count for ${cleanArxivId}: ${cached.count}`)
      return { citationCount: cached.count } as SemanticScholarPaper
    }
    
    const url = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${cleanArxivId}?fields=paperId,title,authors,abstract,year,citationCount,referenceCount,influentialCitationCount,isOpenAccess,openAccessPdf,externalIds,url,venue,fieldsOfStudy,s2FieldsOfStudy`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AstroCompanion/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // Paper not found
      }
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000 // 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return getSemanticScholarPaperByArxivId(arxivId, retryCount + 1)
      }
      
      throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
    }
    
    const data: SemanticScholarPaper = await response.json()
    
    // Cache the result
    if (data.citationCount !== undefined) {
      citationCache.set(cleanArxivId, { count: data.citationCount, timestamp: Date.now() })
    }
    
    return data
    
  } catch (error) {
    console.error('Semantic Scholar fetch error:', error)
    return null
  }
}

// Get paper details by DOI
export async function getSemanticScholarPaperByDOI(doi: string): Promise<SemanticScholarPaper | null> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=paperId,title,authors,abstract,year,citationCount,referenceCount,influentialCitationCount,isOpenAccess,openAccessPdf,externalIds,url,venue,fieldsOfStudy,s2FieldsOfStudy`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AstroCompanion/1.0 (https://github.com/your-repo)',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // Paper not found
      }
      throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
    }
    
    const data: SemanticScholarPaper = await response.json()
    return data
    
  } catch (error) {
    console.error('Semantic Scholar fetch error:', error)
    return null
  }
}

// Batch fetch citation counts for multiple arXiv papers
export async function getCitationCountsForArxivPapers(arxivIds: string[]): Promise<Map<string, number>> {
  const citationCounts = new Map<string, number>()
  
  // Process one at a time to avoid rate limiting
  for (const arxivId of arxivIds) {
    try {
      const paper = await getSemanticScholarPaperByArxivId(arxivId)
      const citationCount = paper?.citationCount || 0
      citationCounts.set(arxivId, citationCount)
      console.log(`Fetched ${citationCount} citations for ${arxivId}`)
      
      // Add delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
    } catch (error) {
      console.error(`Error fetching citation count for ${arxivId}:`, error)
      citationCounts.set(arxivId, 0)
    }
  }
  
  return citationCounts
}

// Extract arXiv ID from various formats
export function extractArxivIdFromString(text: string): string | null {
  // Match various arXiv ID formats
  const patterns = [
    // New format: 1505.01368, 2005.03056, etc.
    /arxiv\.org\/(?:abs\/|pdf\/)?(\d+\.\d+)(?:v\d+)?/i,
    /^(\d{4}\.\d{4,5})(?:v\d+)?$/,
    /^(\d{2}\.\d{4,5})(?:v\d+)?$/,
    // Old format: astro-ph/0409350, astro-ph/9611011, etc.
    /arxiv\.org\/(?:abs\/|pdf\/)?(astro-ph\/\d{7})(?:v\d+)?/i,
    /^(astro-ph\/\d{7})(?:v\d+)?$/,
    // Other old formats: hep-ph/1234567, cond-mat/1234567, etc.
    /arxiv\.org\/(?:abs\/|pdf\/)?([a-z-]+\/\d{7})(?:v\d+)?/i,
    /^([a-z-]+\/\d{7})(?:v\d+)?$/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}
