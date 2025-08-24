import Cite from 'citation-js'

export function renderBibliography(cslArray: any[], style = 'ieee', fmt: 'html' | 'text' = 'html') {
  try {
    const cite = new Cite(cslArray)
    return cite.format('bibliography', { 
      template: style, 
      format: fmt, 
      lang: 'en-US' 
    })
  } catch (error) {
    console.error('Citation rendering error:', error)
    return 'Error rendering bibliography'
  }
}

export function renderInText(cslArray: any[], style = 'apa') {
  try {
    const cite = new Cite(cslArray)
    return cite.format('citation', { 
      template: style, 
      format: 'text', 
      lang: 'en-US' 
    })
  } catch (error) {
    console.error('In-text citation error:', error)
    return 'Error rendering citation'
  }
}

export function extractDOI(text: string): string | null {
  const doiRegex = /10\.\d{4,}(?:\.\d+)*\/\S+(?:\?\S+)?/
  const match = text.match(doiRegex)
  return match ? match[0] : null
}

export function extractArXivID(text: string): string | null {
  const arxivRegex = /arxiv\.org\/(?:abs\/|pdf\/)?(\d+\.\d+)/i
  const match = text.match(arxivRegex)
  return match ? match[1] : null
}

export function extractADSBibcode(text: string): string | null {
  const adsRegex = /\d{4}[A-Za-z]+\d{4}[A-Za-z]/
  const match = text.match(adsRegex)
  return match ? match[0] : null
}
