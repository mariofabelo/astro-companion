import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Set up PDF.js worker - use a reliable CDN
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.js`;

// Cache for rendered thumbnails
const thumbnailCache = new Map<string, string>();

export async function renderFirstPageToCanvas(pdfUrl: string, canvas: HTMLCanvasElement) {
  try {
    // Check cache first
    const cacheKey = `${pdfUrl}_thumbnail`;
    if (thumbnailCache.has(cacheKey)) {
      const cachedDataUrl = thumbnailCache.get(cacheKey);
      if (cachedDataUrl) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = cachedDataUrl;
        return;
      }
    }

    // Load and render PDF
    const pdf = await getDocument({
      url: pdfUrl,
      httpHeaders: {
        'Access-Control-Allow-Origin': '*',
      },
    }).promise;
    
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.6 });
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    // Cache the result
    const dataUrl = canvas.toDataURL();
    thumbnailCache.set(cacheKey, dataUrl);
  } catch (error) {
    console.error('Error rendering PDF thumbnail:', error);
    // Render a placeholder on error
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 140;
      canvas.height = 180;
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PDF Error', canvas.width / 2, canvas.height / 2);
    }
  }
}

export async function renderPdfPage(pdfUrl: string, pageNum: number = 1, scale: number = 1.0) {
  try {
    const pdf = await getDocument({
      url: pdfUrl,
      httpHeaders: {
        'Access-Control-Allow-Origin': '*',
      },
    }).promise;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    throw error;
  }
}

export function clearThumbnailCache() {
  thumbnailCache.clear();
}
