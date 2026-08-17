'use client'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
// CSS imports removed to fix build issues

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  fileUrl: string
  className?: string
}

export default function PDFViewer({ fileUrl, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setError('Failed to load PDF')
    setLoading(false)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      return Math.min(Math.max(1, newPageNumber), numPages || 1)
    })
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  if (error) {
    return (
      <div className={`border rounded p-4 text-center ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={`pdf-document-container ${className}`}>
      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mb-4 bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={previousPage}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">
          Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
        </span>
        <button
          type="button"
          disabled={numPages !== null && pageNumber >= numPages}
          onClick={nextPage}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
        >
          Next →
        </button>
      </div>

      {/* PDF Content */}
      <div className="pdf-viewer-container">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-slate-600 font-medium">Loading PDF...</span>
            </div>
          </div>
        )}
        
        <div className="pdf-viewer-content">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            <div className="pdf-page-container">
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                scale={1.0}
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  )
}
