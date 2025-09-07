import { NextRequest, NextResponse } from "next/server";
import { getCitationCountsForArxivPapers } from "@/lib/semantic-scholar";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const arxivIds = searchParams.get('ids')?.split(',') || [];
    
    if (arxivIds.length === 0) {
      return NextResponse.json({ 
        error: 'Please provide arXiv IDs as comma-separated values in the "ids" parameter' 
      }, { status: 400 });
    }
    
    console.log('Testing citation counts for arXiv IDs:', arxivIds);
    
    const citationCounts = await getCitationCountsForArxivPapers(arxivIds);
    
    const results = arxivIds.map(id => ({
      arxivId: id,
      citationCount: citationCounts.get(id) || 0
    }));
    
    return NextResponse.json({ 
      success: true,
      results,
      totalPapers: arxivIds.length,
      papersWithCitations: results.filter(r => r.citationCount > 0).length
    });
    
  } catch (error) {
    console.error('Test citations API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch citation counts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { arxivIds } = body;
    
    if (!arxivIds || !Array.isArray(arxivIds)) {
      return NextResponse.json({ 
        error: 'Please provide an array of arXiv IDs in the request body' 
      }, { status: 400 });
    }
    
    console.log('Testing citation counts for arXiv IDs:', arxivIds);
    
    const citationCounts = await getCitationCountsForArxivPapers(arxivIds);
    
    const results = arxivIds.map(id => ({
      arxivId: id,
      citationCount: citationCounts.get(id) || 0
    }));
    
    return NextResponse.json({ 
      success: true,
      results,
      totalPapers: arxivIds.length,
      papersWithCitations: results.filter(r => r.citationCount > 0).length
    });
    
  } catch (error) {
    console.error('Test citations API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch citation counts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
