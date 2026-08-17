'use client';

import { useEffect, useState } from 'react';
import { Paper } from '@/types/paper';
import LaTeXText from './LaTeXText';
import { generateSummariesForPapers } from '@/lib/summaries';
import { downloadPaper } from '@/lib/download';
import { isArxivSource, resolvePaperUrls } from '@/lib/paper-utils';

interface PaperIdentificationPanelProps {
  paper: Paper;
  onOpenPDF: () => void;
  onClose: () => void;
  onDeletePaper?: () => void;
  spaceId?: string;
}

export default function PaperIdentificationPanel({ 
  paper, 
  onOpenPDF, 
  onClose,
  onDeletePaper,
  spaceId
}: PaperIdentificationPanelProps) {
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isArxivFallback, setIsArxivFallback] = useState(false);
  const [arxivFallbackPaper, setArxivFallbackPaper] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Set PDF URL for papers
  useEffect(() => {
    const setPdfUrlForPaper = async () => {
      if (paper.source === 'ads' && paper.id.startsWith('ads:')) {
        console.log('🎯 PAPERIDENTIFICATION - PROCESSING ADS PAPER 🎯');
        const bibcode = paper.id.replace('ads:', '');
        console.log('📋 PAPERIDENTIFICATION - EXTRACTED BIBCODE:', bibcode);
        
        // Validate bibcode format before making API call
        const isValidBibcode = /^\d{4}[A-Za-z]+[.\d]*[A-Za-z]/.test(bibcode);
        console.log('✅ PAPERIDENTIFICATION - BIBCODE VALID:', isValidBibcode);
        
        if (!isValidBibcode) {
          console.log(`❌ PAPERIDENTIFICATION - Invalid bibcode format: ${bibcode} - using abstract page directly`);
          setResolvedPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
          return;
        }
        
        setPdfLoading(true);
        try {
          console.log('🌐 PAPERIDENTIFICATION - MAKING API CALL FOR PDF URL 🌐');
          console.log(`📞 PAPERIDENTIFICATION - API URL: /api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
          const response = await fetch(`/api/ads/pdf-url?bibcode=${encodeURIComponent(bibcode)}`);
          console.log('📡 PAPERIDENTIFICATION - API RESPONSE STATUS:', response.status);
          console.log('✅ PAPERIDENTIFICATION - API RESPONSE OK:', response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 PAPERIDENTIFICATION - API RESPONSE DATA:', data);
            console.log('🎯 PAPERIDENTIFICATION - DATA.SUCCESS:', data.success);
            console.log('🔗 PAPERIDENTIFICATION - DATA.PDFURL:', data.pdfUrl);
            console.log('🔄 PAPERIDENTIFICATION - DATA.FALLBACK_TO_ARXIV:', data.fallbackToArxiv);
            
            if (data.success && data.pdfUrl) {
              console.log('🎉 PAPERIDENTIFICATION - SUCCESS! Using resolved PDF URL:', data.pdfUrl);
              setResolvedPdfUrl(data.pdfUrl);
              
              // Check if this is an arXiv paper (now prioritized)
              if (data.fallbackToArxiv && data.arxivPaper) {
                console.log('📚 PAPERIDENTIFICATION - Using arXiv paper (prioritized):', data.arxivPaper.title);
                setIsArxivFallback(true);
                setArxivFallbackPaper(data.arxivPaper);
              } else {
                console.log('📄 PAPERIDENTIFICATION - Using ADS PDF (no arXiv available)');
                setIsArxivFallback(false);
                setArxivFallbackPaper(null);
              }
              return;
            } else {
              console.log('❌ PAPERIDENTIFICATION - API FAILED TO RESOLVE PDF URL');
              console.log('🔍 PAPERIDENTIFICATION - ERROR:', data.error || 'Unknown error');
            }
          } else {
            console.log('❌ PAPERIDENTIFICATION - API RESPONSE NOT OK:', response.status, response.statusText);
          }
          console.log('🔄 PAPERIDENTIFICATION - Falling back to abstract page');
          // Fallback to abstract page if no PDF URL found
          setResolvedPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
          setIsArxivFallback(false);
          setArxivFallbackPaper(null);
        } catch (error) {
          console.error('💥 PAPERIDENTIFICATION - Error getting ADS PDF URL:', error);
          // Fallback to abstract page
          setResolvedPdfUrl(`https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract`);
          setIsArxivFallback(false);
          setArxivFallbackPaper(null);
        } finally {
          setPdfLoading(false);
        }
      } else {
        // For arXiv and other non-ADS papers, resolve URLs
        const urls = resolvePaperUrls(paper);
        setResolvedPdfUrl(urls.url_pdf || '');
        setIsArxivFallback(false);
        setArxivFallbackPaper(null);
      }
    };

    setPdfUrlForPaper();
  }, [paper.id, paper.source, paper.url_pdf]);
  const handleExternalLink = (url: string) => {
    const resolvedUrl = url || resolvePaperUrls(paper).url_html;
    if (!resolvedUrl) return;
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeletePaper = () => {
    if (onDeletePaper) {
      onDeletePaper();
      setShowDeleteConfirm(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (paper.summary) {
      setAiSummary(paper.summary);
      setShowAISummary(true);
      return;
    }

    setSummaryLoading(true);
    try {
      const updatedPapers = await generateSummariesForPapers([paper], spaceId);
      if (updatedPapers.length > 0 && updatedPapers[0].summary) {
        setAiSummary(updatedPapers[0].summary);
        setShowAISummary(true);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDownloadPaper = async () => {
    try {
      await downloadPaper(paper);
    } catch (error) {
      console.error('Failed to download paper:', error);
      // Show user-friendly error message with helpful guidance
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const additionalGuidance = paper.source === 'ads' 
        ? '\n\nAlternative options:\n1. Try opening the abstract page to access PDF links directly\n2. Check if your institution has access to this journal\n3. Look for preprint versions on arXiv if available'
        : '\n\nTry opening the paper in a new tab to access the PDF directly.';
      
      alert(`Failed to download paper: ${errorMessage}${additionalGuidance}`);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Paper Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isArxivSource(paper.source)
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {isArxivSource(paper.source) ? 'arXiv' : paper.source}
          </span>
          {isArxivFallback && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              arXiv PDF
            </span>
          )}
          {paper.year && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
              {paper.year}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Title</h3>
          <LaTeXText 
            text={paper.title}
            as="h1"
            className="text-lg font-bold text-slate-900 leading-tight"
          />
        </div>

        {/* arXiv Fallback Notice */}
        {isArxivFallback && arxivFallbackPaper && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-800 mb-1">arXiv PDF (Prioritized)</h4>
                <p className="text-sm text-green-700 mb-2">
                  We found an arXiv version of this paper, which provides more reliable access than the publisher PDF.
                </p>
                <div className="text-xs text-green-600">
                  <p><strong>arXiv Title:</strong> {arxivFallbackPaper.title}</p>
                  {arxivFallbackPaper.authors && arxivFallbackPaper.authors.length > 0 && (
                    <p><strong>Authors:</strong> {arxivFallbackPaper.authors.slice(0, 3).join(', ')}{arxivFallbackPaper.authors.length > 3 ? ' et al.' : ''}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authors */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Authors</h3>
          <div className="space-y-1">
            {paper.authors.map((author, index) => (
              <p key={index} className="text-sm text-slate-600">
                {author}
              </p>
            ))}
          </div>
        </div>

        {/* Abstract */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Abstract</h3>
          <LaTeXText 
            text={paper.abstract || ''}
            as="p"
            className="text-sm text-slate-700 leading-relaxed"
          />
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          {paper.journal && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Journal</h3>
              <p className="text-sm text-slate-600">{paper.journal}</p>
            </div>
          )}

          {paper.doi && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">DOI</h3>
              <button
                onClick={() => handleExternalLink(`https://doi.org/${paper.doi}`)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {paper.doi}
              </button>
            </div>
          )}

          {paper.publishedDate && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Published</h3>
              <p className="text-sm text-slate-600">{paper.publishedDate}</p>
            </div>
          )}

          {paper.citations && paper.citations > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Citations</h3>
              <p className="text-sm text-slate-600">{paper.citations} citations</p>
            </div>
          )}

          {paper.categories && paper.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-1">
                {paper.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <button
          onClick={onOpenPDF}
          disabled={pdfLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pdfLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
          {pdfLoading ? 'Loading PDF...' : 'Open PDF'}
        </button>

        {(resolvePaperUrls(paper).url_pdf || paper.source === 'ads') && (
          <button
            onClick={handleDownloadPaper}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        )}

        {paper.source === 'ads' && (
          <button
            onClick={() => handleExternalLink(paper.url_html)}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Abstract Page
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExternalLink(paper.url_html)}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Online
          </button>
          
          <button
            onClick={handleGenerateAISummary}
            disabled={summaryLoading}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {summaryLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            AI Summary
          </button>
        </div>

        {/* Delete Button */}
        {onDeletePaper && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove from Space
          </button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Remove Paper</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-700 mb-6">
              Are you sure you want to remove this paper from the research space? 
              The paper will be removed from this space but can be added again later.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaper}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {showAISummary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">AI Summary</h3>
                  <p className="text-sm text-slate-600">Generated summary of the paper</p>
                </div>
              </div>
              <button
                onClick={() => setShowAISummary(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <LaTeXText 
                text={aiSummary}
                as="div"
                className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
