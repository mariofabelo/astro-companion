import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { z } from "zod";
import { SearchResponse, Paper } from "@/types/paper";
import { searchADSPapers } from "@/lib/ads";
import { getCitationCountsForArxivPapers, extractArxivIdFromString } from "@/lib/semantic-scholar";

// Type definitions for arXiv XML response
interface ArxivLink {
  $: {
    rel?: string;
    type?: string;
    href: string;
  };
}

interface ArxivAuthor {
  name: string;
}

interface ArxivCategory {
  $: {
    term: string;
  };
}

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  published: string;
  author?: ArxivAuthor[];
  link?: ArxivLink[];
  category?: ArxivCategory[];
}

interface ArxivFeed {
  feed: {
    entry?: ArxivEntry[];
  };
}

const Body = z.object({
  query: z.string().min(2),
  maxResults: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(10)]).default(5),
  sources: z.array(z.enum(["arXiv","ads"])).default(["arXiv"])
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const { query, maxResults, sources } = body;
    
    const allPapers: Paper[] = [];
    
    // Search arXiv if selected
    if (sources.includes("arXiv")) {
      try {
        const arxivPapers = await searchArxiv(query, maxResults);
        allPapers.push(...arxivPapers);
      } catch (error) {
        console.error('arXiv search error:', error);
        // Continue with other sources even if arXiv fails
      }
    }
    
    // Search ADS if selected
    if (sources.includes("ads")) {
      try {
        const adsPapers = await searchADS(query, maxResults);
        allPapers.push(...adsPapers);
      } catch (error) {
        console.error('ADS search error:', error);
        // Continue with other sources even if ADS fails
      }
    }
    
    // When both sources are selected, ensure balanced results with relevance scoring
    let selectedPapers: Paper[] = [];
    
    if (sources.length === 2) {
      // Both arXiv and ADS selected - ensure at least one from each
      const arxivPapers = allPapers.filter(p => p.source === "arXiv");
      const adsPapers = allPapers.filter(p => p.source === "ads");
      
      // Calculate relevance scores for better selection
      const scorePaper = (paper: Paper): number => {
        let score = 0;
        
        // Base score from API relevance (papers are already sorted by relevance)
        score += 100;
        
        // Boost for citation count (ADS papers have this)
        if (paper.citations && paper.citations > 0) {
          score += Math.min(paper.citations / 10, 50); // Cap at 50 points
        }
        
        // Boost for recent papers (within last 5 years)
        if (paper.year && paper.year >= new Date().getFullYear() - 5) {
          score += 20;
        }
        
        // Boost for papers with abstracts (completeness)
        if (paper.abstract && paper.abstract.length > 100) {
          score += 10;
        }
        
        return score;
      };
      
      // Sort papers by relevance score within each source
      const sortedArxiv = arxivPapers.sort((a, b) => scorePaper(b) - scorePaper(a));
      const sortedAds = adsPapers.sort((a, b) => scorePaper(b) - scorePaper(a));
      
      // Take at least one from each source, then distribute remaining slots
      const minFromEach = Math.max(1, Math.floor(maxResults / 2));
      const remaining = maxResults - (minFromEach * 2);
      
      // Select papers from each source based on relevance
      selectedPapers = [
        ...sortedArxiv.slice(0, minFromEach + Math.ceil(remaining / 2)),
        ...sortedAds.slice(0, minFromEach + Math.floor(remaining / 2))
      ];
      
      // If we don't have enough papers from one source, fill with the other
      if (selectedPapers.length < maxResults) {
        const remainingNeeded = maxResults - selectedPapers.length;
        const usedArxiv = selectedPapers.filter(p => p.source === "arXiv").length;
        const usedAds = selectedPapers.filter(p => p.source === "ads").length;
        
        if (usedArxiv < sortedArxiv.length) {
          const additionalArxiv = sortedArxiv.slice(usedArxiv, usedArxiv + remainingNeeded);
          selectedPapers.push(...additionalArxiv);
        } else if (usedAds < sortedAds.length) {
          const additionalAds = sortedAds.slice(usedAds, usedAds + remainingNeeded);
          selectedPapers.push(...additionalAds);
        }
      }
      
      // Ensure we don't exceed maxResults
      selectedPapers = selectedPapers.slice(0, maxResults);
    } else {
      // Single source or other cases - use original logic
      selectedPapers = allPapers.slice(0, maxResults);
    }
    
    return NextResponse.json({ papers: selectedPapers } as SearchResponse);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    );
  }
}

// Helper function to search arXiv
async function searchArxiv(query: string, maxResults: number): Promise<Paper[]> {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  const feed = await parseStringPromise(xml, { explicitArray: false }) as ArxivFeed;
  const entries = ([] as ArxivEntry[]).concat(feed.feed.entry ?? []);

  // Extract arXiv IDs for citation count lookup
  const arxivIds: string[] = [];
  const papers = entries.map((e, i) => {
    const links = ([] as ArxivLink[]).concat(e.link ?? []);
    const html = links.find((l) => l.$?.rel === "alternate")?.$.href ?? e.id;
    const pdf = links.find((l) => l.$?.type === "application/pdf")?.$.href;
    const authors = ([] as ArxivAuthor[]).concat(e.author ?? []).map((a) => a.name).filter(Boolean);
    
    // Extract arXiv ID from the entry
    const arxivId = extractArxivIdFromString(e.id || '');
    if (arxivId) {
      arxivIds.push(arxivId);
    }
    
    return {
      id: `arxiv:${e.id?.split('/abs/')[1] ?? i}`,
      source: "arXiv" as const,
      title: (e.title || "").replace(/\s+/g," ").trim(),
      authors,
      abstract: (e.summary || "").replace(/\s+/g," ").trim(),
      year: e.published ? Number((e.published as string).slice(0,4)) : undefined,
      categories: e.category ? ([] as ArxivCategory[]).concat(e.category).map((c) => c.$.term) : [],
      url_html: html,
      url_pdf: pdf,
      citations: 0, // Will be updated with Semantic Scholar data
      publishedDate: e.published ? new Date(e.published).toLocaleDateString() : undefined,
      journal: "arXiv",
      arxivId: arxivId || undefined // Convert null to undefined
    };
  });

  // Fetch citation counts from Semantic Scholar
  try {
    const citationCounts = await getCitationCountsForArxivPapers(arxivIds);
    
    // Update papers with citation counts
    return papers.map(paper => ({
      ...paper,
      citations: paper.arxivId ? (citationCounts.get(paper.arxivId) || 0) : 0
    }));
  } catch (error) {
    console.error('Error fetching citation counts from Semantic Scholar:', error);
    // Return papers with 0 citations if Semantic Scholar fails
    return papers;
  }
}

// Helper function to search ADS
async function searchADS(query: string, maxResults: number): Promise<Paper[]> {
  const adsResults = await searchADSPapers({
    query,
    maxResults
  });
  
  return adsResults.map(adsPaper => ({
    id: `ads:${adsPaper.bibcode}`,
    source: "ads" as const,
    title: adsPaper.title,
    authors: adsPaper.authors,
    abstract: adsPaper.abstract,
    year: adsPaper.year,
    categories: [], // ADS doesn't provide categories in the same way
    url_html: adsPaper.url_html || `https://ui.adsabs.harvard.edu/abs/${adsPaper.bibcode}/abstract`,
    url_pdf: adsPaper.url_pdf,
    citations: adsPaper.citation_count,
    publishedDate: adsPaper.pubdate ? new Date(adsPaper.pubdate).toLocaleDateString() : undefined,
    journal: adsPaper.journal,
    doi: adsPaper.doi
  }));
}
