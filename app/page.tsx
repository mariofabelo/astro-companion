import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'

export default function Dashboard() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-6 space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Papers</h2>
            {/* TODO: List recent papers */}
            <p className="text-gray-500">No papers yet. Upload your first PDF!</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                Upload PDF
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                Create Note
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Library Stats</h2>
            {/* TODO: Show library statistics */}
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </main>
      </div>
    </AuthGate>
  )
}
