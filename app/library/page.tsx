import FileUploader from '@/components/FileUploader'
import UniverseBackground from '@/components/UniverseBackground'

export default function LibraryPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Universe Background */}
      <UniverseBackground />
      
      <div className="relative z-10 p-8">
        <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Library</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Upload PDF
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Upload New Paper</h2>
        <FileUploader onDone={(paperId) => {
          console.log('Paper uploaded:', paperId)
          // TODO: Redirect to paper page or refresh list
        }} />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Your Papers</h2>
        {/* TODO: List papers from database */}
        <p className="text-gray-500">No papers uploaded yet.</p>
      </div>
        </div>
      </div>
    </div>
  )
}
