import { Paper, Source } from '@/types/paper';

export function isArxivSource(source: string): boolean {
  return source.toLowerCase() === 'arxiv';
}

export function normalizePaperSource(source: string): Source {
  if (isArxivSource(source)) return 'arXiv';
  if (source.toLowerCase() === 'ads') return 'ads';
  return source as Source;
}

export function extractArxivIdFromPaper(paper: Paper): string | null {
  if (paper.arxivId) {
    return paper.arxivId.split('v')[0];
  }

  if (paper.id.startsWith('arxiv:')) {
    return paper.id.replace('arxiv:', '').split('v')[0];
  }

  const bareIdMatch = paper.id.match(/^(\d{4}\.\d{4,})(v\d+)?$/);
  if (bareIdMatch && isArxivSource(paper.source)) {
    return bareIdMatch[1];
  }

  return null;
}

export function getArxivUrls(arxivId: string): { url_html: string; url_pdf: string } {
  const cleanId = arxivId.split('v')[0];
  return {
    url_html: `https://arxiv.org/abs/${cleanId}`,
    url_pdf: `https://arxiv.org/pdf/${cleanId}.pdf`,
  };
}

function isValidHttpUrl(url?: string): url is string {
  return !!url && url.startsWith('http');
}

export function resolvePaperUrls(paper: Paper): { url_html: string; url_pdf?: string } {
  if (isArxivSource(paper.source)) {
    const arxivId = extractArxivIdFromPaper(paper);
    if (arxivId) {
      const urls = getArxivUrls(arxivId);
      return {
        url_html: isValidHttpUrl(paper.url_html) ? paper.url_html : urls.url_html,
        url_pdf: isValidHttpUrl(paper.url_pdf) ? paper.url_pdf : urls.url_pdf,
      };
    }
  }

  return {
    url_html: paper.url_html,
    url_pdf: paper.url_pdf,
  };
}

export function normalizePaper(paper: Paper): Paper {
  const source = normalizePaperSource(paper.source);
  const urls = resolvePaperUrls({ ...paper, source });

  let id = paper.id;
  if (isArxivSource(source)) {
    const arxivId = extractArxivIdFromPaper({ ...paper, source });
    if (arxivId && !paper.id.startsWith('arxiv:')) {
      id = `arxiv:${arxivId}`;
    }
  }

  return {
    ...paper,
    id,
    source,
    url_html: urls.url_html,
    url_pdf: urls.url_pdf,
    arxivId: extractArxivIdFromPaper({ ...paper, source, id }) || paper.arxivId,
  };
}
