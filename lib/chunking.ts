export interface TextChunk {
  index: number
  content: string
  tokens?: number
}

export function chunkText(text: string, maxChunkSize: number = 1200, overlap: number = 200): TextChunk[] {
  const chunks: TextChunk[] = []
  let index = 0
  
  // Simple character-based chunking
  for (let i = 0; i < text.length; i += maxChunkSize - overlap) {
    const chunkContent = text.slice(i, i + maxChunkSize)
    chunks.push({
      index,
      content: chunkContent.trim()
    })
    index++
  }
  
  return chunks
}

// More sophisticated chunking based on sentences/paragraphs
export function chunkTextBySentences(text: string, maxChunkSize: number = 1200): TextChunk[] {
  const chunks: TextChunk[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  let index = 0
  
  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + '. '
    
    if (currentChunk.length + sentenceWithPunctuation.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        index,
        content: currentChunk.trim()
      })
      currentChunk = sentenceWithPunctuation
      index++
    } else {
      currentChunk += sentenceWithPunctuation
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      index,
      content: currentChunk.trim()
    })
  }
  
  return chunks
}
