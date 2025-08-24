// TODO: Implement ADS API integration for fetching paper metadata

export interface ADSPaper {
  bibcode: string
  title: string
  authors: string[]
  abstract: string
  pubdate: string
  doi?: string
  arxiv_id?: string
}

export async function fetchADSPaper(bibcode: string): Promise<ADSPaper | null> {
  try {
    // TODO: Implement ADS API call
    // For now, return a placeholder
    console.log('Fetching ADS paper:', bibcode)
    return null
  } catch (error) {
    console.error('ADS fetch error:', error)
    return null
  }
}

export function isValidBibcode(bibcode: string): boolean {
  const bibcodeRegex = /^\d{4}[A-Za-z]+\d{4}[A-Za-z]/
  return bibcodeRegex.test(bibcode)
}
