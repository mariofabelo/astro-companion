import PDFViewer from '@/components/PDFViewer'
import ChatPanel from '@/components/ChatPanel'
import UniverseBackground from '@/components/UniverseBackground'

export default function PaperPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Universe Background */}
      <UniverseBackground />
      
      <div className="relative z-10 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h1 className="text-xl font-semibold mb-2">Paper Title</h1>
          <p className="text-gray-600">DOI: ...</p>
          <p className="text-gray-600">Uploaded: ...</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">PDF Viewer</h2>
          <PDFViewer fileUrl="/api/papers/[id]/pdf" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Chat with Paper</h2>
        <ChatPanel paperIds={[params.id]} />
      </div>
        </div>
      </div>
    </div>
  )
}
