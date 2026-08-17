import { NextRequest, NextResponse } from 'next/server';
import { fetchADSPaper } from '@/lib/ads';
import { fetchArXivPaper } from '@/lib/arxiv';

// Search arXiv for papers matching ADS paper metadata
async function searchArXivForPaper(adsPaper: any): Promise<any | null> {
  try {
    // Extract key search terms from the ADS paper
    const title = adsPaper.title || '';
    const authors = adsPaper.authors || [];
    const arxivId = adsPaper.arxiv_id;
    
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
    const searchTerms = [];
    
    // Add title words (remove common words)
    const titleWords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were'].includes(word))
      .slice(0, 5); // Take first 5 meaningful words
    
    searchTerms.push(...titleWords);
    
    // Add first author's last name if available
    if (firstAuthor && firstAuthor.length > 2) {
      searchTerms.push(firstAuthor);
    }
    
    const query = searchTerms.join(' ');
    console.log(`Constructed arXiv search query: "${query}"`);
    
    // Search arXiv using their API
    const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`arXiv search API error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse XML response
    const entries = [];
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
          const authors = [];
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
    entries.sort((a, b) => b.similarity - a.similarity);
    
    if (entries.length > 0 && entries[0].similarity > 0.3) {
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
function calculateSimilarity(adsPaper: any, arxivPaper: any): number {
  let score = 0;
  
  // Title similarity (most important)
  const adsTitle = (adsPaper.title || '').toLowerCase();
  const arxivTitle = (arxivPaper.title || '').toLowerCase();
  
  // Simple word overlap scoring
  const adsWords = new Set(adsTitle.split(/\s+/).filter(w => w.length > 3));
  const arxivWords = new Set(arxivTitle.split(/\s+/).filter(w => w.length > 3));
  
  const commonWords = new Set([...adsWords].filter(x => arxivWords.has(x)));
  const totalWords = new Set([...adsWords, ...arxivWords]);
  
  if (totalWords.size > 0) {
    score += (commonWords.size / totalWords.size) * 0.6; // 60% weight for title
  }
  
  // Author similarity
  const adsAuthors = (adsPaper.authors || []).map((a: string) => a.toLowerCase());
  const arxivAuthors = (arxivPaper.authors || []).map((a: string) => a.toLowerCase());
  
  // Check if any authors match (by last name)
  const adsLastNames = adsAuthors.map(a => a.split(' ').pop()).filter(Boolean);
  const arxivLastNames = arxivAuthors.map(a => a.split(' ').pop()).filter(Boolean);
  
  const commonLastNames = adsLastNames.filter(name => arxivLastNames.includes(name));
  if (adsLastNames.length > 0) {
    score += (commonLastNames.length / Math.max(adsLastNames.length, arxivLastNames.length)) * 0.3; // 30% weight for authors
  }
  
  // Abstract similarity (basic keyword matching)
  const adsAbstract = (adsPaper.abstract || '').toLowerCase();
  const arxivAbstract = (arxivPaper.abstract || '').toLowerCase();
  
  const adsAbstractWords = new Set(adsAbstract.split(/\s+/).filter(w => w.length > 4));
  const arxivAbstractWords = new Set(arxivAbstract.split(/\s+/).filter(w => w.length > 4));
  
  const commonAbstractWords = new Set([...adsAbstractWords].filter(x => arxivAbstractWords.has(x)));
  const totalAbstractWords = new Set([...adsAbstractWords, ...arxivAbstractWords]);
  
  if (totalAbstractWords.size > 0) {
    score += (commonAbstractWords.size / totalAbstractWords.size) * 0.1; // 10% weight for abstract
  }
  
  return Math.min(score, 1.0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bibcode } = body;
    
    if (!bibcode) {
      return NextResponse.json(
        { error: 'bibcode parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Searching arXiv fallback for ADS paper: ${bibcode}`);
    
    // First, fetch the ADS paper to get its metadata
    const adsPaper = await fetchADSPaper(bibcode);
    if (!adsPaper) {
      return NextResponse.json(
        { error: 'ADS paper not found' },
        { status: 404 }
      );
    }
    
    // Search arXiv for matching paper
    const arxivPaper = await searchArXivForPaper(adsPaper);
    
    if (arxivPaper) {
      return NextResponse.json({
        success: true,
        arxivPaper,
        adsPaper: {
          bibcode: adsPaper.bibcode,
          title: adsPaper.title,
          authors: adsPaper.authors
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No arXiv equivalent found',
        adsPaper: {
          bibcode: adsPaper.bibcode,
          title: adsPaper.title,
          authors: adsPaper.authors
        }
      });
    }
    
  } catch (error) {
    console.error('Error in arXiv fallback search:', error);
    return NextResponse.json(
      { error: 'Failed to search arXiv fallback' },
      { status: 500 }
    );
  }
}


