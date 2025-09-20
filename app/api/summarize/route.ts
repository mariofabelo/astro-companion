import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabaseServer } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { abstract, title, paperId } = await req.json()
    
    if (!abstract || !title) {
      return NextResponse.json({ error: 'Abstract and title are required' }, { status: 400 })
    }

    // If we have a paperId, check if summary already exists in cache
    if (paperId) {
      const sb = await supabaseServer()
      const { data: existingSummary } = await sb
        .from('paper_summaries')
        .select('summary')
        .eq('paper_id', paperId)
        .single()

      if (existingSummary?.summary) {
        console.log('Returning cached summary for paper:', paperId)
        return NextResponse.json({ summary: existingSummary.summary, cached: true })
      }
    }

    // Generate summary using OpenAI
    const systemPrompt = `You are a research assistant that creates concise, informative summaries of scientific paper abstracts. 
Your summaries should:
- Be 2-3 sentences long
- Capture the main research question, methodology, and key findings
- Use clear, accessible language
- Focus on the most important contributions
- Avoid technical jargon when possible`

    const userPrompt = `Please summarize this research paper abstract:

Title: ${title}

Abstract: ${abstract}

Provide a concise 2-3 sentence summary that captures the main research question, methodology, and key findings.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const summary = completion.choices[0].message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }

    // Cache the summary if we have a paperId
    if (paperId) {
      try {
        const sb = await supabaseServer()
        await sb
          .from('paper_summaries')
          .upsert({
            paper_id: paperId,
            title,
            abstract,
            summary,
            created_at: new Date().toISOString()
          })
        console.log('Cached summary for paper:', paperId)
      } catch (cacheError) {
        console.error('Failed to cache summary:', cacheError)
        // Don't fail the request if caching fails
      }
    }

    return NextResponse.json({ summary, cached: false })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

