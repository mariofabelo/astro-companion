import TipTapEditor from '@/components/TipTapEditor/Editor'

export default function NotePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Note Title</h1>
          <div className="space-x-2">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Save
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>
        
        <TipTapEditor 
          content={null}
          onUpdate={(json) => {
            console.log('Note updated:', json)
            // TODO: Save to database
          }}
        />
      </div>
    </div>
  )
}
