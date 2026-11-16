'use client'
import dynamic from 'next/dynamic'

// pdf.js needs browser APIs (DOMMatrix), so only load the viewer on the client
const PDFViewer = dynamic(() => import('./PDFViewerInner'), { ssr: false })

export default PDFViewer
