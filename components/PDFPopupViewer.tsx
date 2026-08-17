'use client';

import { useState, useRef, useEffect } from 'react';
import { Paper } from '@/types/paper';
import { useAnnotations } from '@/lib/useAnnotations';
import { isArxivSource, resolvePaperUrls } from '@/lib/paper-utils';
import AnnotationToolbar from './AnnotationToolbar';
import PDFAnnotationOverlay from './PDFAnnotationOverlay';
import IframeAnnotationOverlay from './IframeAnnotationOverlay';
import { Document, Page, pdfjs } from 'react-pdf';
// Removed client-side ADS PDF resolution - now using API endpoint

// Set up PDF.js worker - use local worker file for better reliability
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFPopupViewerProps {
  paper: Paper;
  onClose: () => void;
}

export default function PDFPopupViewer({ paper, onClose }: PDFPopupViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isArxivFallback, setIsArxivFallback] = useState(false);
  const [arxivFallbackPaper, setArxivFallbackPaper] = useState<any>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [useIframe, setUseIframe] = useState(false);

  // Annotation system
  const {
    tool,
    annotations,
    setTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAllAnnotations,
    getAnnotationsForPage
  } = useAnnotations({ paperId: paper.id });

  // Set PDF URL for papers
  useEffect(() => {
    const setPdfUrlForPaper = async () => {
      if (paper.source === 'ads') {
        console.log('🎯 PDFPOPUP - PROCESSING ADS PAPER 🎯');
        const bibcode = paper.id.replace('ads:', '');
        console.log('📋 PDFPOPUP - EXTRACTED BIBCODE:', bibcode);
        
        // Validate bibcode format before making API call
        const isValidBibcode = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/.test(bibcode);
        console.log('✅ PDFPOPUP - BIBCODE VALID:', isValidBibcode);
        
        if (!isValidBibcode) {
          console.log(`❌ PDFPOPUP - Invalid bibcode format: ${bibcode} - using abstract page directly`);
          setPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
          return;
        }
        
        try {
          console.log('🌐 PDFPOPUP - MAKING API CALL FOR PDF URL 🌐');
          console.log(`📞 PDFPOPUP - API URL: /api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
          const response = await fetch(`/api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
          console.log('📡 PDFPOPUP - API RESPONSE STATUS:', response.status);
          console.log('✅ PDFPOPUP - API RESPONSE OK:', response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 PDFPOPUP - API RESPONSE DATA:', data);
            console.log('🎯 PDFPOPUP - DATA.SUCCESS:', data.success);
            console.log('🔗 PDFPOPUP - DATA.PDFURL:', data.pdfUrl);
            
            if (data.success && data.pdfUrl) {
              console.log('🎉 PDFPOPUP - SUCCESS! Using resolved PDF URL:', data.pdfUrl);
              setPdfUrl(data.pdfUrl);
              
              // Check if this is an arXiv paper (now prioritized)
              if (data.fallbackToArxiv && data.arxivPaper) {
                console.log('📚 PDFPOPUP - Using arXiv PDF (prioritized):', data.arxivPaper.url_pdf);
                console.log('📄 PDFPOPUP - arXiv paper title:', data.arxivPaper.title);
                setIsArxivFallback(true);
                setArxivFallbackPaper(data.arxivPaper);
              } else {
                console.log('📄 PDFPOPUP - Using ADS PDF (no arXiv available)');
                setIsArxivFallback(false);
                setArxivFallbackPaper(null);
              }
              return;
            } else {
              console.log('❌ PDFPOPUP - API FAILED TO RESOLVE PDF URL');
              console.log('🔍 PDFPOPUP - ERROR:', data.error || 'Unknown error');
            }
          } else {
            console.log('❌ PDFPOPUP - API RESPONSE NOT OK:', response.status, response.statusText);
          }
          console.log('🔄 PDFPOPUP - Falling back to abstract page');
          // Fallback to abstract page if no PDF URL found
          setPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
        } catch (error) {
          console.error('💥 PDFPOPUP - Error getting ADS PDF URL:', error);
          // Fallback to abstract page
          setPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
        }
      } else {
        // For arXiv and other non-ADS papers, resolve URLs
        const urls = resolvePaperUrls(paper);
        setPdfUrl(urls.url_pdf || urls.url_html);
      }
    };

    setPdfUrlForPaper();
  }, [paper.id, paper.source, paper.url_pdf, paper.url_html]);

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      
      // Check if URL is likely to have CORS issues and use iframe mode directly
      const corsProblematicDomains = ['arxiv.org', 'ui.adsabs.harvard.edu'];
      const hasCorsIssues = corsProblematicDomains.some(domain => pdfUrl.includes(domain));
      
      if (hasCorsIssues) {
        console.log('Detected potential CORS issues, using iframe mode directly');
        setUseIframe(true);
        setIsLoading(false);
      } else {
        setUseIframe(false);
      }
    }
  }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL:', pdfUrl);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    console.log('Falling back to iframe mode');
    setUseIframe(true);
    setError(null);
    setIsLoading(false);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't handle shortcuts if user is typing in an input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        handlePreviousPage();
        break;
      case 'ArrowRight':
        handleNextPage();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleResetZoom();
        break;
      case 'Escape':
        onClose();
        break;
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleFullscreen();
        }
        break;
      // Annotation shortcuts
      case 'h':
      case 'H':
        if (showAnnotations) {
          e.preventDefault();
          setTool({ type: 'highlight', color: tool.color || 'yellow' });
        }
        break;
      case 'n':
      case 'N':
        if (showAnnotations) {
          e.preventDefault();
          setTool({ type: 'sticky-note' });
        }
        break;
      case 't':
      case 'T':
        if (showAnnotations) {
          e.preventDefault();
          setTool({ type: 'text', alignment: tool.alignment || 'left' });
        }
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, scale]);


  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-none z-50 flex items-center justify-center ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-[90vw] h-[90vh] max-w-6xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900 truncate max-w-md">
              {paper.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isArxivSource(paper.source)
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {isArxivSource(paper.source) ? 'arXiv' : paper.source}
              </span>
              {isArxivFallback && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  arXiv PDF
                </span>
              )}
              {paper.year && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {paper.year}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Annotation Toggle */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`p-2 rounded-lg transition-colors ${
                showAnnotations 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Toggle annotations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page (←)"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-sm text-slate-600 min-w-[80px] text-center">
                {currentPage} / {totalPages || '?'}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page (→)"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom out (-)"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <span className="text-sm text-slate-600 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom in (+)"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reset zoom (0)"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle fullscreen (Ctrl+F)"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Annotation Toolbar */}
        {showAnnotations && (
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <AnnotationToolbar
                tool={tool}
                onToolChange={setTool}
                onClearAnnotations={clearAllAnnotations}
                annotationCount={annotations.length}
              />
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {tool.type === 'highlight' && 'Highlight Mode'}
                  {tool.type === 'sticky-note' && 'Sticky Note Mode'}
                  {tool.type === 'text' && 'Text Mode'}
                </span>
                <span className="text-slate-500">•</span>
                <span>Click and drag to annotate</span>
              </div>
            </div>
            {useIframe && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Note:</strong> PDF loaded in iframe mode due to CORS restrictions. Highlighting is not available, but sticky notes and text annotations work.
              </div>
            )}
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 relative overflow-hidden bg-slate-50">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          {pdfUrl && (
            useIframe ? (
              <IframeAnnotationOverlay
                pageNumber={currentPage}
                tool={tool}
                annotations={getAnnotationsForPage(currentPage)}
                onAddAnnotation={addAnnotation}
                onUpdateAnnotation={updateAnnotation}
                onDeleteAnnotation={deleteAnnotation}
                scale={scale}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: `${100 / scale}%`,
                    height: `${100 / scale}%`
                  }}
                  title={`PDF: ${paper.title}`}
                />
              </IframeAnnotationOverlay>
            ) : (
              <PDFAnnotationOverlay
                pageNumber={currentPage}
                tool={tool}
                annotations={getAnnotationsForPage(currentPage)}
                onAddAnnotation={addAnnotation}
                onUpdateAnnotation={updateAnnotation}
                onDeleteAnnotation={deleteAnnotation}
                scale={scale}
              >
                <div className="pdf-viewer-content w-full h-full overflow-auto">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                  >
                    <div className="pdf-page-container">
                      <Page
                        pageNumber={currentPage}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        scale={scale}
                      />
                    </div>
                  </Document>
                </div>
              </PDFAnnotationOverlay>
            )
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
          <div className="flex items-center justify-center gap-6">
            <span>← → Navigate pages</span>
            <span>+ - Zoom</span>
            <span>0 Reset zoom</span>
            <span>Ctrl+F Fullscreen</span>
            {showAnnotations && (
              <>
                <span>H Highlight</span>
                <span>N Sticky note</span>
                <span>T Text</span>
              </>
            )}
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
