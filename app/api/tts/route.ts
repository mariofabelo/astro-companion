import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabaseServer } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { paperId, text } = await req.json()
    
    if (!text || !paperId) {
      return NextResponse.json({ error: 'Missing text or paperId' }, { status: 400 })
    }
    
    // Generate audio using OpenAI TTS
    const audio = await openai.audio.speech.create({ 
      model: 'tts-1', 
      voice: 'alloy', 
      input: text 
    })
    
    const buf = Buffer.from(await audio.arrayBuffer())
    const path = `${paperId}.mp3`
    
    // Upload to Supabase storage
    const sb = await supabaseServer()
    await sb.storage.from('audio').upload(path, buf, { 
      upsert: true, 
      contentType: 'audio/mpeg' 
    })
    
    return NextResponse.json({ path })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
}
