import { fetchArXivPaper } from '@/lib/arxiv';

// Minimal shape of a paper used for arXiv matching (ADS or arXiv metadata)
export interface PaperLike {
  title?: string;
  authors?: string[];
  abstract?: string;
  arxiv_id?: string;
  arxivId?: string;
}

export interface ArxivMatch {
  arxivId?: string;
  title: string;
  authors: string[];
  abstract?: string;
  published?: string;
  similarity?: number;
  url_pdf: string;
  url_html: string;
  source: 'arXiv';
  id: string;
  journal: string;
  year?: number;
  [key: string]: unknown;
}

// Search arXiv for papers matching ADS paper metadata
export async function searchArXivForPaper(adsPaper: PaperLike): Promise<ArxivMatch | null> {
  try {
    // Extract key search terms from the ADS paper
    const title = adsPaper.title || '';
    const authors = adsPaper.authors || [];
    const arxivId = adsPaper.arxiv_id || adsPaper.arxivId;
    
    // If we already have an arXiv ID, try to fetch that specific paper
    if (arxivId) {
      console.log(`Found arXiv ID in ADS paper: ${arxivId}, attempting to fetch`);
      const arxivPaper = await fetchArXivPaper(arxivId);
      if (arxivPaper) {
        return {
          ...arxivPaper,
          url_pdf: `https://arxiv.org/pdf/${arxivId}.pdf`,
          url_html: `https://arxiv.org/abs/${arxivId}`,
          source: 'arXiv',
          id: `arxiv:${arxivId}`,
          journal: 'arXiv'
        };
      }
    }
    
    // If no arXiv ID or fetch failed, try searching by title and authors
    console.log(`Searching arXiv for paper: "${title}" by ${authors.slice(0, 2).join(', ')}`);
    
    // Create search query from title and first author
    const firstAuthor = authors.length > 0 ? authors[0].split(' ').pop() : '';
    const searchTerms: string[] = [];
    
    // Add title words (remove common words)
    const titleWords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were'].includes(word))
      .slice(0, 5); // Take first 5 meaningful words
    
    searchTerms.push(...titleWords);
    
    // Add first author's last name if available
    if (firstAuthor && firstAuthor.length > 2) {
      searchTerms.push(firstAuthor);
    }
    
    const query = searchTerms.join(' ');
    console.log(`Constructed arXiv search query: "${query}"`);
    
    // Search arXiv using their API
    const searchUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`arXiv search API error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse XML response
    const entries: ArxivMatch[] = [];
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    
    if (entryMatches) {
      for (const entryXml of entryMatches) {
        try {
          // Extract basic fields
          const idMatch = entryXml.match(/<id>([^<]+)<\/id>/);
          const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
          const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
          const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
          
          if (!idMatch || !titleMatch) continue;
          
          const arxivId = idMatch[1].split('/abs/')[1];
          const arxivTitle = titleMatch[1].trim();
          const arxivAbstract = summaryMatch?.[1]?.trim() || '';
          const published = publishedMatch?.[1] || '';
          
          // Extract authors
          const authors: string[] = [];
          const authorMatches = entryXml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g);
          if (authorMatches) {
            authorMatches.forEach(authorXml => {
              const nameMatch = authorXml.match(/<name>([^<]+)<\/name>/);
              if (nameMatch) {
                authors.push(nameMatch[1].trim());
              }
            });
          }
          
          // Calculate similarity score
          const similarity = calculateSimilarity(adsPaper, {
            title: arxivTitle,
            authors,
            abstract: arxivAbstract
          });
          
          entries.push({
            arxivId,
            title: arxivTitle,
            authors,
            abstract: arxivAbstract,
            published,
            similarity,
            url_pdf: `https://arxiv.org/pdf/${arxivId}.pdf`,
            url_html: `https://arxiv.org/abs/${arxivId}`,
            source: 'arXiv',
            id: `arxiv:${arxivId}`,
            journal: 'arXiv',
            year: published ? parseInt(published.slice(0, 4)) : undefined
          });
        } catch (error) {
          console.error('Error parsing arXiv entry:', error);
          continue;
        }
      }
    }
    
    // Sort by similarity and return the best match
    entries.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    
    if (entries.length > 0 && (entries[0].similarity ?? 0) > 0.3) {
      console.log(`Found arXiv match with similarity ${entries[0].similarity}: ${entries[0].title}`);
      return entries[0];
    }
    
    console.log('No suitable arXiv match found');
    return null;
    
  } catch (error) {
    console.error('Error searching arXiv for paper:', error);
    return null;
  }
}

// Calculate similarity between ADS paper and arXiv paper
function calculateSimilarity(adsPaper: PaperLike, arxivPaper: PaperLike): number {
  let score = 0;
  
  // Title similarity (most important)
  const adsTitle = (adsPaper.title || '').toLowerCase();
  const arxivTitle = (arxivPaper.title || '').toLowerCase();
  
  // Simple word overlap scoring
  const adsWords = new Set(adsTitle.split(/\s+/).filter((w: string) => w.length > 3));
  const arxivWords = new Set(arxivTitle.split(/\s+/).filter((w: string) => w.length > 3));
  
  const commonWords = new Set([...adsWords].filter(x => arxivWords.has(x)));
  const totalWords = new Set([...adsWords, ...arxivWords]);
  
  if (totalWords.size > 0) {
    score += (commonWords.size / totalWords.size) * 0.6; // 60% weight for title
  }
  
  // Author similarity
  const adsAuthors = (adsPaper.authors || []).map((a: string) => a.toLowerCase());
  const arxivAuthors = (arxivPaper.authors || []).map((a: string) => a.toLowerCase());
  
  // Check if any authors match (by last name)
  const adsLastNames = adsAuthors.map((a: string) => a.split(' ').pop()).filter(Boolean);
  const arxivLastNames = arxivAuthors.map((a: string) => a.split(' ').pop()).filter(Boolean);
  
  const commonLastNames = adsLastNames.filter((name: string | undefined) => arxivLastNames.includes(name));
  if (adsLastNames.length > 0) {
    score += (commonLastNames.length / Math.max(adsLastNames.length, arxivLastNames.length)) * 0.3; // 30% weight for authors
  }
  
  // Abstract similarity (basic keyword matching)
  const adsAbstract = (adsPaper.abstract || '').toLowerCase();
  const arxivAbstract = (arxivPaper.abstract || '').toLowerCase();
  
  const adsAbstractWords = new Set(adsAbstract.split(/\s+/).filter((w: string) => w.length > 4));
  const arxivAbstractWords = new Set(arxivAbstract.split(/\s+/).filter((w: string) => w.length > 4));
  
  const commonAbstractWords = new Set([...adsAbstractWords].filter(x => arxivAbstractWords.has(x)));
  const totalAbstractWords = new Set([...adsAbstractWords, ...arxivAbstractWords]);
  
  if (totalAbstractWords.size > 0) {
    score += (commonAbstractWords.size / totalAbstractWords.size) * 0.1; // 10% weight for abstract
  }
  
  return Math.min(score, 1.0);
}
