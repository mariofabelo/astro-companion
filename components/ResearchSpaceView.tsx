'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';
import PaperCanvas from './PaperCanvas';
import PaperIdentificationPanel from './PaperIdentificationPanel';
import PDFPopupViewer from './PDFPopupViewer';

interface ResearchSpace {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  papers: Paper[];
}

interface ResearchSpaceViewProps {
  space: ResearchSpace;
  onBack: () => void;
  onUpdateSpace: (updatedSpace: ResearchSpace) => void;
}

export default function ResearchSpaceView({ 
  space, 
  onBack, 
  onUpdateSpace 
}: ResearchSpaceViewProps) {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showIdentificationPanel, setShowIdentificationPanel] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfPaper, setPdfPaper] = useState<Paper | null>(null);

  const handlePaperClick = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowIdentificationPanel(true);
  };

  const handlePaperSelect = (paper: Paper) => {
    setPdfPaper(paper);
    setShowPDFViewer(true);
  };

  const handleOpenPDF = () => {
    if (selectedPaper) {
      setPdfPaper(selectedPaper);
      setShowPDFViewer(true);
      setShowIdentificationPanel(false);
    }
  };

  const handleCloseIdentificationPanel = () => {
    setShowIdentificationPanel(false);
    setSelectedPaper(null);
  };

  const handleClosePDFViewer = () => {
    setShowPDFViewer(false);
    setPdfPaper(null);
  };

  const handleRemovePaper = (paperId: string) => {
    const updatedSpace = {
      ...space,
      papers: space.papers.filter(p => p.id !== paperId)
    };
    onUpdateSpace(updatedSpace);
    
    // Close identification panel if the removed paper was selected
    if (selectedPaper?.id === paperId) {
      setShowIdentificationPanel(false);
      setSelectedPaper(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{space.title}</h1>
              <p className="text-slate-600">{space.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              {space.papers.length} paper{space.papers.length !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-slate-500">
              {space.timestamp}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Paper Canvas */}
        <div className={`flex-1 transition-all duration-300 ${
          showIdentificationPanel ? 'mr-80' : ''
        }`}>
          {space.papers.length > 0 ? (
            <PaperCanvas
              papers={space.papers}
              onPaperClick={handlePaperClick}
              onPaperSelect={handlePaperSelect}
              selectedPaper={selectedPaper}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No papers yet</h3>
                <p className="text-slate-500">Search for papers to add them to this space</p>
              </div>
            </div>
          )}
        </div>

        {/* Paper Identification Panel */}
        {showIdentificationPanel && selectedPaper && (
          <div className="absolute right-0 top-0 h-full z-10">
            <PaperIdentificationPanel
              paper={selectedPaper}
              onOpenPDF={handleOpenPDF}
              onClose={handleCloseIdentificationPanel}
            />
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      {showPDFViewer && pdfPaper && (
        <PDFPopupViewer
          paper={pdfPaper}
          onClose={handleClosePDFViewer}
        />
      )}
    </div>
  );
}
