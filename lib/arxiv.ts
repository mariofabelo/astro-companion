// ArXiv API integration for fetching paper metadata

export interface ArXivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  published: string
  updated: string
  categories: string[]
  doi?: string
}

// ArXiv API response interfaces
interface ArXivAuthor {
  name: string
}

interface ArXivEntry {
  id: string
  title: string
  summary: string
  published: string
  updated: string
  authors: ArXivAuthor[]
  'arxiv:doi'?: { $t: string }
  'arxiv:primary_category'?: { $t: string }
  category?: string[]
}

interface ArXivResponse {
  feed: {
    entry: ArXivEntry[]
  }
}

export async function fetchArXivPaper(arxivId: string): Promise<ArXivPaper | null> {
  try {
    // Clean the ArXiv ID (remove version suffix if present)
    const cleanId = arxivId.split('v')[0]
    
    const url = `https://export.arxiv.org/api/query?id_list=${cleanId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.status}`)
    }
    
    const xmlText = await response.text()
    
    // Simple XML parsing using regex (since we're in Node.js environment)
    // Check if we have results
    const totalResultsMatch = xmlText.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/)
    if (!totalResultsMatch || totalResultsMatch[1] === '0') {
      return null
    }
    
    // Extract entry data using regex
    const entryMatch = xmlText.match(/<entry>([\s\S]*?)<\/entry>/)
    if (!entryMatch) {
      return null
    }
    
    const entryXml = entryMatch[1]
    
    // Extract basic fields
    const idMatch = entryXml.match(/<id>([^<]+)<\/id>/)
    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/)
    const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/)
    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/)
    const updatedMatch = entryXml.match(/<updated>([^<]+)<\/updated>/)
    
    const title = titleMatch?.[1]?.trim() || ''
    const summary = summaryMatch?.[1]?.trim() || ''
    const published = publishedMatch?.[1] || ''
    const updated = updatedMatch?.[1] || ''
    
    // Extract authors
    const authors: string[] = []
    const authorMatches = entryXml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g)
    if (authorMatches) {
      authorMatches.forEach(authorXml => {
        const nameMatch = authorXml.match(/<name>([^<]+)<\/name>/)
        if (nameMatch) {
          authors.push(nameMatch[1].trim())
        }
      })
    }
    
    // Extract DOI
    const doiMatch = entryXml.match(/<arxiv:doi>([^<]+)<\/arxiv:doi>/)
    const doi = doiMatch?.[1] || undefined
    
    // Extract categories
    const categories: string[] = []
    const categoryMatches = entryXml.match(/<category term="([^"]+)"/g)
    if (categoryMatches) {
      categoryMatches.forEach(cat => {
        const termMatch = cat.match(/term="([^"]+)"/)
        if (termMatch) {
          categories.push(termMatch[1])
        }
      })
    }
    
    return {
      id: cleanId,
      title,
      authors,
      abstract: summary,
      published,
      updated,
      categories,
      doi
    }
    
  } catch (error) {
    console.error('ArXiv fetch error:', error)
    return null
  }
}

export function isValidArXivID(id: string): boolean {
  const arxivRegex = /^\d{4}\.\d{4,}(v\d+)?$/
  return arxivRegex.test(id)
}
