'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PaperUploadPreview from './PaperUploadPreview';
import { Paper } from '@/types/paper';
import { ResearchSpace } from '@/lib/research-spaces';
import { getArxivUrls, normalizePaper } from '@/lib/paper-utils';

interface FileUploaderProps {
  onFilesUploaded?: (files: File[]) => void;
  onPaperProcessed?: (paperId: string, paperData: any) => void;
  researchSpaces?: ResearchSpace[];
  onAddToSpace?: (papers: Paper[], spaceId: string) => void;
  onCreateNewSpace?: (papers: Paper[], spaceTitle: string) => void;
}

export default function FileUploader({ 
  onFilesUploaded, 
  onPaperProcessed, 
  researchSpaces = [], 
  onAddToSpace, 
  onCreateNewSpace 
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processedPaper, setProcessedPaper] = useState<Paper | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...pdfFiles]);
      onFilesUploaded?.(pdfFiles);
    }
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    try {
      // Here you would implement the actual file upload logic
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Handle successful upload
      console.log('Files uploaded successfully:', uploadedFiles);
      
      // Clear the uploaded files after successful upload
      setUploadedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateLink = (url: string): { isValid: boolean; type: 'arxiv' | 'ads' | 'unknown' } => {
    // ArXiv URL patterns - more comprehensive
    const arxivPatterns = [
      /^https?:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,}(v\d+)?)$/,
      /^https?:\/\/arxiv\.org\/pdf\/(\d{4}\.\d{4,}(v\d+)?)\.pdf$/,
      /^https?:\/\/arxiv\.org\/e-print\/(\d{4}\.\d{4,}(v\d+)?)$/,
      /^(\d{4}\.\d{4,}(v\d+)?)$/ // Just the ID
    ];

    // ADS URL patterns - more comprehensive
    const adsPatterns = [
      /^https?:\/\/ui\.adsabs\.harvard\.edu\/abs\/([^\/\?]+)/,
      /^https?:\/\/adsabs\.harvard\.edu\/abs\/([^\/\?]+)/,
      /^https?:\/\/ui\.adsabs\.harvard\.edu\/link\/([^\/\?]+)/,
      /^https?:\/\/adsabs\.harvard\.edu\/link\/([^\/\?]+)/,
      /^([A-Za-z0-9\.]+)$/ // Just the bibcode
    ];

    for (const pattern of arxivPatterns) {
      if (pattern.test(url)) {
        return { isValid: true, type: 'arxiv' };
      }
    }

    for (const pattern of adsPatterns) {
      if (pattern.test(url)) {
        return { isValid: true, type: 'ads' };
      }
    }

    return { isValid: false, type: 'unknown' };
  };

  const processLink = async () => {
    if (!linkInput.trim()) return;

    // Clear previous messages
    setLinkError(null);
    setLinkSuccess(null);

    const validation = validateLink(linkInput.trim());
    if (!validation.isValid) {
      setLinkError('Please enter a valid ArXiv or ADS link. Examples:\n• ArXiv: https://arxiv.org/abs/2301.00001\n• ADS: https://ui.adsabs.harvard.edu/abs/2023ApJ...950L..20M');
      return;
    }

    setIsProcessingLink(true);
    try {
      const response = await fetch('/api/process-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: linkInput.trim(),
          type: validation.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process link');
      }

      const result = await response.json();
      console.log('Link processed successfully:', result);
      
      // Convert the result to a Paper object for preview
      const arxivId = validation.type === 'arxiv'
        ? (result.paper?.id || result.paperId)
        : null;
      const arxivUrls = arxivId ? getArxivUrls(arxivId) : null;

      const paper = normalizePaper({
        id: validation.type === 'arxiv'
          ? `arxiv:${arxivId}`
          : `ads:${result.paper?.id || result.paperId}`,
        source: validation.type === 'arxiv' ? 'arXiv' : 'ads',
        title: result.paper?.title || 'Unknown Title',
        authors: result.paper?.authors || [],
        abstract: result.paper?.abstract || '',
        publishedDate: result.paper?.published || '',
        journal: result.paper?.journal || (validation.type === 'arxiv' ? 'arXiv' : ''),
        doi: result.paper?.doi || '',
        arxivId: arxivId || result.paper?.arxiv_id || '',
        url_html: arxivUrls?.url_html || result.paper?.url_html || '',
        url_pdf: arxivUrls?.url_pdf || result.paper?.url_pdf,
        year: result.paper?.year,
        citations: result.paper?.citation_count
      });
      
      // Show preview modal
      setProcessedPaper(paper);
      setShowPreview(true);
      
      // Call the callback if provided
      if (onPaperProcessed && result.paperId) {
        onPaperProcessed(result.paperId, result.paper);
      }
      
      // Clear the input
      setLinkInput('');
      
    } catch (error) {
      console.error('Link processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process link. Please try again.';
      
      // Provide more specific error messages
      if (errorMessage.includes('ADS_API_TOKEN')) {
        setLinkError('ADS API token not configured. Please contact the administrator.');
      } else if (errorMessage.includes('Could not fetch paper data')) {
        setLinkError('Could not find the paper. Please check the URL and try again.');
      } else if (errorMessage.includes('Invalid')) {
        setLinkError('Invalid URL format. Please check the link and try again.');
      } else {
        setLinkError(errorMessage);
      }
    } finally {
      setIsProcessingLink(false);
    }
  };

  const handleAddToSpace = (papers: Paper[], spaceId: string) => {
    if (onAddToSpace) {
      onAddToSpace(papers, spaceId);
    }
    setShowPreview(false);
    setProcessedPaper(null);
  };

  const handleCreateNewSpace = (papers: Paper[], spaceTitle: string) => {
    if (onCreateNewSpace) {
      onCreateNewSpace(papers, spaceTitle);
    }
    setShowPreview(false);
    setProcessedPaper(null);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setProcessedPaper(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragActive
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-white/40 hover:border-white/60 bg-white/20'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {isDragActive ? 'Drop your PDFs here' : 'Upload Research Papers'}
            </h3>
            <p className="text-gray-600 mb-3">
              Drag and drop your PDF files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supported format: PDF only
            </p>
          </div>
        </div>
      </div>

      {/* Link Input Section */}
      <div className="border-2 border-dashed rounded-2xl p-6 bg-white/20 backdrop-blur-sm border-white/40">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Or paste a link</h4>
              <p className="text-sm text-gray-600">Enter an ArXiv or ADS link to automatically download the paper</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://arxiv.org/abs/2301.00001 or https://ui.adsabs.harvard.edu/abs/2023ApJ...950L..20M"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              onKeyPress={(e) => e.key === 'Enter' && processLink()}
            />
            
            <button
              onClick={processLink}
              disabled={!linkInput.trim() || isProcessingLink}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessingLink ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Process Link</span>
                </>
              )}
            </button>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Supported formats:</p>
            <p>• ArXiv: https://arxiv.org/abs/2301.00001</p>
            <p>• ADS: https://ui.adsabs.harvard.edu/abs/2023ApJ...950L..20M</p>
          </div>

          {/* Error Message */}
          {linkError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{linkError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {linkSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">{linkSuccess}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Selected Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload Papers</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Paper Upload Preview Modal */}
      {showPreview && processedPaper && (
        <PaperUploadPreview
          paper={processedPaper}
          researchSpaces={researchSpaces}
          onAddToSpace={handleAddToSpace}
          onCreateNewSpace={handleCreateNewSpace}
          onClose={handleClosePreview}
        />
      )}

    </div>
  );
}
