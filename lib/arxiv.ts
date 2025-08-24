// TODO: Implement arXiv API integration for fetching paper metadata

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

export async function fetchArXivPaper(arxivId: string): Promise<ArXivPaper | null> {
  try {
    // TODO: Implement arXiv API call
    // For now, return a placeholder
    console.log('Fetching arXiv paper:', arxivId)
    return null
  } catch (error) {
    console.error('ArXiv fetch error:', error)
    return null
  }
}

export function isValidArXivID(id: string): boolean {
  const arxivRegex = /^\d{4}\.\d{4,}$/
  return arxivRegex.test(id)
}
