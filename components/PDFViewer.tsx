'use client'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={previousPage}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </span>
          <button
            type="button"
            disabled={numPages !== null && pageNumber >= numPages}
            onClick={nextPage}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="border rounded overflow-auto max-h-96">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading PDF...</span>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            scale={1.0}
          />
        </Document>
      </div>
    </div>
  )
}
