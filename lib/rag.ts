import { createSupabaseBrowser } from './supabase-client'
import { openai } from './openai'

export interface RAGResult {
  answer: string
  matches: any[]
  sources: string[]
}

export async function queryRAG(
  query: string, 
  paperIds?: string[], 
  matchCount: number = 12
): Promise<RAGResult> {
  try {
    const sb = createSupabaseBrowser()
    
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
      match_count: matchCount 
    })
    
    if (error) {
      throw error
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
    
    const answer = completion.choices[0].message?.content || 'No answer generated'
    
    return {
      answer,
      matches: matches || [],
      sources: matches?.map((m: any) => m.paper_id) || []
    }
  } catch (error) {
    console.error('RAG query error:', error)
    throw error
  }
}
