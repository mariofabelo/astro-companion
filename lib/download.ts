import { Paper } from '@/types/paper';

/**
 * Downloads a PDF file from a URL
 * @param url - The URL of the PDF to download
 * @param filename - The filename for the downloaded file
 */
export async function downloadPDF(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Generates a filename for a paper based on its title and source
 * @param paper - The paper object
 * @returns A sanitized filename
 */
export function generatePaperFilename(paper: Paper): string {
  // Sanitize the title for use as filename
  const sanitizedTitle = paper.title
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  const source = paper.source.toLowerCase();
  const year = paper.year || 'unknown';
  
  return `${sanitizedTitle}_${source}_${year}.pdf`;
}

/**
 * Downloads a paper's PDF
 * @param paper - The paper object to download
 */
export async function downloadPaper(paper: Paper): Promise<void> {
  if (!paper.url_pdf) {
    throw new Error('No PDF URL available for this paper');
  }
  
  const filename = generatePaperFilename(paper);
  await downloadPDF(paper.url_pdf, filename);
}

/**
 * Opens a paper's PDF in a new tab
 * @param paper - The paper object to open
 */
export function openPaperInNewTab(paper: Paper): void {
  if (!paper.url_pdf) {
    throw new Error('No PDF URL available for this paper');
  }
  
  window.open(paper.url_pdf, '_blank', 'noopener,noreferrer');
}
