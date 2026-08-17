'use client';

import { useState } from 'react';
import PDFPopupViewer from '@/components/PDFPopupViewer';
import AnnotationDebug from '@/components/AnnotationDebug';
import { Paper } from '@/types/paper';

export default function TestAnnotationsPage() {
  const [showPDF, setShowPDF] = useState(false);

  // Create a test paper with a sample PDF URL
  const testPaper: Paper = {
    id: 'test-paper-1',
    title: 'Test PDF for Annotations',
    authors: ['Test Author'],
    abstract: 'This is a test paper to demonstrate the annotation system.',
    year: '2024',
    source: 'test',
    url_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Sample PDF URL
    url_html: '',
    doi: '',
    arxiv_id: '',
    bibcode: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">PDF Annotation System Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Test the Annotation System</h2>
          <p className="text-slate-600 mb-4">
            Click the button below to open a test PDF with the annotation system enabled.
          </p>
          
          <button
            onClick={() => setShowPDF(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Open Test PDF with Annotations
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">How to Test</h2>
          <ol className="text-slate-600 space-y-2">
            <li>1. Click "Open Test PDF with Annotations" above</li>
            <li>2. The PDF viewer will open with annotation tools enabled</li>
            <li>3. Click the annotation toggle button (📌) in the header if not already enabled</li>
            <li>4. Try the different annotation tools:</li>
            <ul className="ml-6 mt-2 space-y-1">
              <li>• <strong>Highlight (H):</strong> Click and drag to create colored highlights</li>
              <li>• <strong>Sticky Note (N):</strong> Click anywhere to add a yellow sticky note</li>
              <li>• <strong>Text (T):</strong> Click anywhere to add text annotations</li>
            </ul>
            <li>5. Click on any annotation to edit it</li>
            <li>6. Click the × button on annotations to delete them</li>
            <li>7. Use the clear button to remove all annotations</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Debug Panel</h2>
          <p className="text-slate-600 mb-4">
            Use this debug panel to test the annotation system functionality:
          </p>
          <AnnotationDebug paperId={testPaper.id} />
        </div>
      </div>

      {showPDF && (
        <PDFPopupViewer
          paper={testPaper}
          onClose={() => setShowPDF(false)}
        />
      )}
    </div>
  );
}
