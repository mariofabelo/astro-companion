import { NextRequest, NextResponse } from 'next/server'
import Cite from 'citation-js'

export async function POST(req: NextRequest) {
  try {
    const { cslArray, style = 'ieee' } = await req.json()
    
    if (!cslArray || !Array.isArray(cslArray)) {
      return NextResponse.json({ error: 'Invalid CSL array' }, { status: 400 })
    }
    
    const cite = new Cite(cslArray)
    const bib = cite.format('bibliography', { 
      template: style, 
      format: 'html',
      lang: 'en-US'
    })
    
    return NextResponse.json({ bib })
  } catch (error) {
    console.error('Citation formatting error:', error)
    return NextResponse.json({ error: 'Citation formatting failed' }, { status: 500 })
  }
}
