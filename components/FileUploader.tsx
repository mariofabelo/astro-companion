'use client'
import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-client'

export default function FileUploader({ onDone }: { onDone?: (paperId: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.includes('pdf')) {
      alert('Please select a PDF file')
      return
    }
    
    setLoading(true)
    setProgress(0)
    
    try {
      const sb = createSupabaseBrowser()
      const { data: user } = await sb.auth.getUser()
      
      if (!user.user) {
        throw new Error('User not authenticated')
      }
      
      const paperId = crypto.randomUUID()
      const path = `${user.user.id}/${paperId}.pdf`
      
      setProgress(25)
      
      // Upload file to storage
      const { error: uploadError } = await sb.storage
        .from('pdfs')
        .upload(path, file, { 
          upsert: true, 
          contentType: 'application/pdf' 
        })
      
      if (uploadError) {
        throw uploadError
      }
      
      setProgress(50)
      
      // Create paper record in database
      const { error: dbError } = await sb.from('papers').insert({
        id: paperId,
        owner: user.user.id,
        pdf_path: path,
        title: file.name.replace('.pdf', '')
      })
      
      if (dbError) {
        throw dbError
      }
      
      setProgress(100)
      onDone?.(paperId)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Select PDF File'}
        </label>
        <p className="mt-2 text-sm text-gray-500">
          {loading ? 'Please wait while we process your file...' : 'Drag and drop a PDF file here, or click to select'}
        </p>
      </div>
      
      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}
