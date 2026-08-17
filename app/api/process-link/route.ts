import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/db'
import { fetchArXivPaper } from '@/lib/arxiv'
import { fetchADSPaperWithPDF } from '@/lib/ads'

export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json()
    
    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type are required' }, { status: 400 })
    }

    let paperData: any = null
    let pdfUrl: string | null = null
    let user: any = null
    let sb: any = null

    // For arXiv papers, we don't need authentication (like search feature)
    // For ADS papers, we still require authentication
    if (type === 'ads') {
      sb = await supabaseServer()
      // Get current user for ADS papers
      const { data: { user: authUser } } = await sb.auth.getUser()
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = authUser
    }

    if (type === 'arxiv') {
      // Extract ArXiv ID from URL - more flexible patterns
      const arxivIdMatch = url.match(/(\d{4}\.\d{4,}(v\d+)?)/)
      if (!arxivIdMatch) {
        return NextResponse.json({ error: 'Invalid ArXiv URL format. Please provide a valid ArXiv URL or ID.' }, { status: 400 })
      }
      
      const arxivId = arxivIdMatch[1]
      console.log('Fetching ArXiv paper:', arxivId)
      paperData = await fetchArXivPaper(arxivId)
      
      if (paperData) {
        // Extract year from published date and add citation count
        const year = paperData.published ? parseInt(paperData.published.slice(0, 4)) : undefined
        
        // Try to get citation count from Semantic Scholar
        let citationCount = 0
        try {
          const { getSemanticScholarPaperByArxivId } = await import('@/lib/semantic-scholar')
          const semanticPaper = await getSemanticScholarPaperByArxivId(arxivId)
          citationCount = semanticPaper?.citationCount || 0
        } catch (error) {
          console.log('Could not fetch citation count from Semantic Scholar:', error)
        }
        
        // Add year and citation count to paperData
        paperData = {
          ...paperData,
          year,
          citation_count: citationCount,
          url_html: `https://arxiv.org/abs/${arxivId}`,
          url_pdf: `https://arxiv.org/pdf/${arxivId}.pdf`,
        }
        pdfUrl = paperData.url_pdf
        console.log('ArXiv paper found:', paperData.title, 'Year:', year, 'Citations:', citationCount)
      } else {
        console.log('ArXiv paper not found for ID:', arxivId)
      }
    } else if (type === 'ads') {
      // Extract bibcode from URL - more specific patterns for ADS URLs
      let bibcode: string
      
      // Try to extract from full ADS URL first
      const urlMatch = url.match(/\/abs\/([A-Za-z0-9\.]+)/)
      if (urlMatch) {
        bibcode = urlMatch[1]
      } else {
        // If it's just a bibcode (no URL), validate it directly
        const bibcodeMatch = url.match(/^([A-Za-z0-9\.]+)$/)
        if (!bibcodeMatch) {
          return NextResponse.json({ error: 'Invalid ADS URL format. Please provide a valid ADS URL or bibcode.' }, { status: 400 })
        }
        bibcode = bibcodeMatch[1]
      }
      console.log('Fetching ADS paper:', bibcode)
      
      try {
        const adsResult = await fetchADSPaperWithPDF(bibcode)
        
        if (adsResult) {
          paperData = {
            id: adsResult.bibcode,
            title: adsResult.title,
            authors: adsResult.authors,
            abstract: adsResult.abstract,
            published: adsResult.pubdate,
            doi: adsResult.doi,
            arxiv_id: adsResult.arxiv_id,
            journal: adsResult.journal,
            url_html: adsResult.url_html,
            year: adsResult.year,
            citation_count: adsResult.citation_count
          }
          pdfUrl = adsResult.url_pdf || null
          console.log('ADS paper found:', paperData.title)
        } else {
          console.log('ADS paper not found for bibcode:', bibcode)
        }
      } catch (error) {
        console.error('ADS fetch error:', error)
        if (error instanceof Error && error.message.includes('ADS API token')) {
          return NextResponse.json({ error: 'ADS API token not configured. Please contact the administrator.' }, { status: 503 })
        }
        // Re-throw the error to be handled by the outer catch block
        throw error
      }
    }

    if (!paperData) {
      const errorMessage = type === 'arxiv' 
        ? 'Could not find the ArXiv paper. Please check the URL and try again.'
        : 'Could not find the ADS paper. Please check the URL and try again.'
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }

    // For arXiv papers without authentication, just return the paper data
    if (type === 'arxiv' && !user) {
      return NextResponse.json({ 
        success: true, 
        paperId: paperData.id, // Use arXiv ID as paper ID
        paper: paperData,
        hasPdf: !!pdfUrl,
        message: 'ArXiv paper processed successfully (no database storage without authentication)'
      })
    }

    // Generate unique paper ID for authenticated users
    const paperId = crypto.randomUUID()
    
    // Download PDF if available
    let pdfPath: string | null = null
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl)
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer()
          const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
          
          // Upload to Supabase storage
          const storagePath = `${user.id}/${paperId}.pdf`
          const { error: uploadError } = await sb.storage
            .from('pdfs')
            .upload(storagePath, pdfBlob, { 
              upsert: true, 
              contentType: 'application/pdf' 
            })
          
          if (!uploadError) {
            pdfPath = storagePath
          }
        }
      } catch (error) {
        console.error('PDF download failed:', error)
      }
    }

    // Save paper metadata to database (only for authenticated users)
    const paperRecord = {
      id: paperId,
      owner: user.id,
      title: paperData.title,
      doi: paperData.doi,
      arxiv_id: paperData.arxiv_id,
      ads_bibcode: type === 'ads' ? paperData.id : null,
      pdf_path: pdfPath,
      csl: {
        type: 'article-journal',
        title: paperData.title,
        author: paperData.authors?.map((author: string) => ({ family: author, given: '' })) || [],
        abstract: paperData.abstract,
        issued: paperData.published ? { 'date-parts': [[paperData.published.slice(0, 4)]] } : undefined,
        'container-title': paperData.journal,
        DOI: paperData.doi,
        URL: paperData.url_html,
        source: type,
        source_url: url
      }
    }

    const { error: insertError } = await sb.from('papers').insert(paperRecord)

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save paper' }, { status: 500 })
    }

    // If PDF was successfully downloaded, trigger ingestion
    if (pdfPath) {
      try {
        const ingestResponse = await fetch(`${req.nextUrl.origin}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId })
        })
        
        if (!ingestResponse.ok) {
          console.error('Ingestion failed:', await ingestResponse.text())
        }
      } catch (error) {
        console.error('Ingestion request failed:', error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      paperId,
      paper: paperData,
      hasPdf: !!pdfPath
    })

  } catch (error) {
    console.error('Process link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

