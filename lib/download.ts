import { Paper } from '@/types/paper';
import { isArxivSource, resolvePaperUrls } from '@/lib/paper-utils';

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
  let pdfUrl = isArxivSource(paper.source)
    ? resolvePaperUrls(paper).url_pdf
    : paper.url_pdf;
  
  console.log('🚀 DOWNLOAD PAPER FUNCTION CALLED 🚀');
  console.log('📄 PAPER OBJECT:', paper);
  console.log('🔗 INITIAL PDF URL:', pdfUrl);
  console.log('📊 PAPER SOURCE:', paper.source);
  console.log('🆔 PAPER ID:', paper.id);
  
  // For ADS papers, always try to get the actual PDF URL
  if (paper.source === 'ads') {
    console.log('🎯 PROCESSING ADS PAPER 🎯');
    const bibcode = paper.id.replace('ads:', '');
    console.log('📋 EXTRACTED BIBCODE:', bibcode);
    
    // Validate bibcode format before making API call
    const isValidBibcode = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/.test(bibcode);
    console.log('✅ BIBCODE VALID:', isValidBibcode);
    
    if (isValidBibcode) {
      console.log('🌐 MAKING API CALL FOR PDF URL 🌐');
      console.log(`📞 API URL: /api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
      try {
        const response = await fetch(`/api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
        console.log('📡 API RESPONSE STATUS:', response.status);
        console.log('✅ API RESPONSE OK:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 API RESPONSE DATA:', data);
          console.log('🎯 DATA.SUCCESS:', data.success);
          console.log('🔗 DATA.PDFURL:', data.pdfUrl);
          
          if (data.success && data.pdfUrl) {
            console.log('🎉 SUCCESS! Using resolved PDF URL:', data.pdfUrl);
            pdfUrl = data.pdfUrl;
            console.log('✅ UPDATED PDFURL:', pdfUrl);
            
            // Check if this is an arXiv paper (prioritized) and log it
            if (data.fallbackToArxiv && data.arxivPaper) {
              console.log('📚 DOWNLOAD - Using arXiv PDF (prioritized):', data.arxivPaper.url_pdf);
              console.log('📄 DOWNLOAD - arXiv paper title:', data.arxivPaper.title);
            } else {
              console.log('📄 DOWNLOAD - Using ADS PDF (no arXiv available)');
            }
          } else {
            console.log('❌ API FAILED TO RESOLVE PDF URL');
            console.log('🔍 ERROR:', data.error || 'Unknown error');
            console.log('📊 SUCCESS VALUE:', data.success);
            console.log('🔗 PDFURL VALUE:', data.pdfUrl);
          }
        } else {
          console.log('❌ API RESPONSE NOT OK:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error resolving ADS PDF URL for download:', error);
      }
    } else {
      console.log(`Invalid bibcode format: ${bibcode} - skipping PDF resolution for download`);
    }
  }
  
  console.log('🏁 FINAL CHECK - PDFURL:', pdfUrl);
  console.log('🔍 PDFURL IS NULL/UNDEFINED:', !pdfUrl);
  
  if (!pdfUrl) {
    console.log('💥 THROWING ERROR - NO PDF URL AVAILABLE');
    console.log('📊 PAPER SOURCE:', paper.source);
    if (paper.source === 'ads') {
      throw new Error('No PDF available for this ADS paper. The paper may not have an accessible PDF, may be behind a paywall, or the bibcode may be invalid. Try opening the abstract page to access available links.');
    } else {
      throw new Error('No PDF URL available for this paper');
    }
  }
  
  // Check if the PDF URL is likely to be blocked by publisher security
  if (pdfUrl.includes('iopscience.iop.org') || pdfUrl.includes('link_gateway')) {
    console.log('⚠️ WARNING: PDF URL may be blocked by publisher security measures');
    // For now, we'll still try to download, but provide better error handling
  }
  
  const filename = generatePaperFilename(paper);
  await downloadPDF(pdfUrl, filename);
}

/**
 * Opens a paper's PDF in a new tab
 * @param paper - The paper object to open
 */
export async function openPaperInNewTab(paper: Paper): Promise<void> {
  let pdfUrl = isArxivSource(paper.source)
    ? resolvePaperUrls(paper).url_pdf
    : paper.url_pdf;
  
  // For ADS papers, always try to get the actual PDF URL
  if (paper.source === 'ads') {
    const bibcode = paper.id.replace('ads:', '');
    
    // Validate bibcode format before making API call
    const isValidBibcode = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/.test(bibcode);
    
    if (isValidBibcode) {
      try {
        const response = await fetch(`/api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.pdfUrl) {
            pdfUrl = data.pdfUrl;
            
            // Check if this is an arXiv paper (prioritized) and log it
            if (data.fallbackToArxiv && data.arxivPaper) {
              console.log('📚 OPEN - Using arXiv PDF (prioritized):', data.arxivPaper.url_pdf);
              console.log('📄 OPEN - arXiv paper title:', data.arxivPaper.title);
            } else {
              console.log('📄 OPEN - Using ADS PDF (no arXiv available)');
            }
          }
        }
      } catch (error) {
        console.error('Error resolving ADS PDF URL for opening:', error);
      }
    }
  }
  
  if (!pdfUrl) {
    if (paper.source === 'ads') {
      throw new Error('No PDF available for this ADS paper. The paper may not have an accessible PDF, may be behind a paywall, or the bibcode may be invalid. Try opening the abstract page to access available links.');
    } else {
      throw new Error('No PDF URL available for this paper');
    }
  }
  
  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}
