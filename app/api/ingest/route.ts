import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/server/db'
import { openai } from '@/lib/openai'
import pdf from 'pdf-parse'

export async function POST(req: NextRequest) {
  try {
    const { paperId } = await req.json()
    const sb = supabaseServer()
    
    // Fetch paper & download PDF from storage
    const { data: paper } = await sb.from('papers').select('*').eq('id', paperId).single()
    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }
    
    const { data: file } = await sb.storage.from('pdfs').download(paper.pdf_path)
    if (!file) {
      return NextResponse.json({ error: 'PDF file not found' }, { status: 404 })
    }
    
    const buf = Buffer.from(await file.arrayBuffer())
    const parsed = await pdf(buf)
    const text = parsed.text

    // Naive chunking
    const max = 1200
    const chunks = [] as { idx: number; content: string }[]
    for (let i = 0, idx = 0; i < text.length; i += max, idx++) {
      chunks.push({ idx, content: text.slice(i, i + max) })
    }

    // Create embeddings for each chunk
    for (const ch of chunks) {
      const emb = await openai.embeddings.create({ 
        model: 'text-embedding-3-large', 
        input: ch.content 
      })
      const vec = emb.data[0].embedding
      await sb.from('chunks').insert({ 
        paper_id: paperId, 
        chunk_index: ch.idx, 
        content: ch.content, 
        embedding: vec 
      })
    }
    
    return NextResponse.json({ ok: true, chunks: chunks.length })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
