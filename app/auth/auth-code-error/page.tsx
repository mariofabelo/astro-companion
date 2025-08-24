import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error during the authentication process. Please try signing in again.
          </p>
          <Link 
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
