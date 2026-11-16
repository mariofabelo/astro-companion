import { NextRequest, NextResponse } from 'next/server';
import { fetchADSPaper } from '@/lib/ads';
import { searchArXivForPaper } from '@/lib/arxiv-fallback';

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


