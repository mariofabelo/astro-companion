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

    const sb = await supabaseServer()
    
    // Get current user
    const { data: { user } } = await sb.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let paperData: any = null
    let pdfUrl: string | null = null

    if (type === 'arxiv') {
      // Extract ArXiv ID from URL
      const arxivIdMatch = url.match(/(\d{4}\.\d{4,}(v\d+)?)/)
      if (!arxivIdMatch) {
        return NextResponse.json({ error: 'Invalid ArXiv URL format' }, { status: 400 })
      }
      
      const arxivId = arxivIdMatch[1]
      paperData = await fetchArXivPaper(arxivId)
      
      if (paperData) {
        // Construct PDF URL for ArXiv
        pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`
      }
    } else if (type === 'ads') {
      // Extract bibcode from URL
      const bibcodeMatch = url.match(/([A-Za-z0-9\.]+)/)
      if (!bibcodeMatch) {
        return NextResponse.json({ error: 'Invalid ADS URL format' }, { status: 400 })
      }
      
      const bibcode = bibcodeMatch[1]
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
          url_html: adsResult.url_html
        }
        pdfUrl = adsResult.url_pdf
      }
    }

    if (!paperData) {
      return NextResponse.json({ error: 'Could not fetch paper data' }, { status: 404 })
    }

    // Generate unique paper ID
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

    // Save paper metadata to database
    const { error: insertError } = await sb.from('papers').insert({
      id: paperId,
      owner: user.id,
      title: paperData.title,
      authors: paperData.authors,
      abstract: paperData.abstract,
      published: paperData.published,
      doi: paperData.doi,
      arxiv_id: paperData.arxiv_id,
      journal: paperData.journal,
      url_html: paperData.url_html,
      pdf_path: pdfPath,
      source_type: type,
      source_url: url
    })

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
