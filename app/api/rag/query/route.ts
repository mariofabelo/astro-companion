import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/db'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { query, paperIds } = await req.json()
    const sb = await supabaseServer()
    
    // Create embedding for the query
    const emb = await openai.embeddings.create({ 
      model: 'text-embedding-3-small', 
      input: query 
    })
    const vec = emb.data[0].embedding
    
    // Find similar chunks
    const { data: matches, error } = await sb.rpc('match_chunks', { 
      query_embedding: vec, 
      paper_ids: paperIds ?? null, 
      match_count: 12 
    })
    
    if (error) {
      console.error('RAG query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Build context from matches
    const context = matches?.map((m: any) => m.content).join('\n\n') || ''
    
    // Generate answer using OpenAI
    const sys = `You are a STEM research assistant. Answer with citations to chunk numbers when relevant.`
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys }, 
        { role: 'user', content: `Q: ${query}\n\nContext:\n${context}` }
      ],
      temperature: 0.2
    })
    
    return NextResponse.json({ 
      answer: completion.choices[0].message?.content, 
      matches 
    })
  } catch (error) {
    console.error('RAG query error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
