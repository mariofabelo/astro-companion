import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { z } from "zod";
import { SearchResponse } from "@/types/paper";

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
  maxResults: z.union([z.literal(2), z.literal(5), z.literal(10)]).default(5),
  sources: z.array(z.enum(["arXiv","ads"])).default(["arXiv"])
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const k = body.maxResults;

    // v1: arXiv only
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(body.query)}&start=0&max_results=${k}&sortBy=relevance`;

    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const feed = await parseStringPromise(xml, { explicitArray: false }) as ArxivFeed;
    const entries = ([] as ArxivEntry[]).concat(feed.feed.entry ?? []);

    const papers = entries.map((e, i) => {
      const links = ([] as ArxivLink[]).concat(e.link ?? []);
      const html = links.find((l) => l.$?.rel === "alternate")?.$.href ?? e.id;
      const pdf = links.find((l) => l.$?.type === "application/pdf")?.$.href;
      const authors = ([] as ArxivAuthor[]).concat(e.author ?? []).map((a) => a.name).filter(Boolean);
      
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
        citations: 0, // arXiv doesn't provide citation count in basic API
        publishedDate: e.published ? new Date(e.published).toLocaleDateString() : undefined,
        journal: "arXiv"
      };
    });

    return NextResponse.json({ papers } as SearchResponse);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    );
  }
}
