import { Paper } from '@/types/paper'
import { researchSpacesService } from './research-spaces'

export async function generateSummary(paper: Paper): Promise<string> {
  if (!paper.abstract) {
    return 'No abstract available for this paper.'
  }

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        abstract: paper.abstract,
        title: paper.title
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate summary')
    }

    const data = await response.json()
    return data.summary || 'Failed to generate summary'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Summary generation failed'
  }
}

export async function generateSummariesForPapers(
  papers: Paper[], 
  spaceId?: string
): Promise<Paper[]> {
  const papersWithSummaries = await Promise.all(
    papers.map(async (paper) => {
      if (!paper.summary && paper.abstract) {
        const summary = await generateSummary(paper)
        return { ...paper, summary }
      }
      return paper
    })
  )

  // If we have a spaceId, save the updated papers back to the database
  if (spaceId && papersWithSummaries.some(p => p.summary && !papers.find(orig => orig.id === p.id && orig.summary))) {
    try {
      await researchSpacesService.updateSpace(spaceId, {
        papers: papersWithSummaries
      })
      console.log('Saved summaries to database for space:', spaceId)
    } catch (error) {
      console.error('Failed to save summaries to database:', error)
    }
  }

  return papersWithSummaries
}
