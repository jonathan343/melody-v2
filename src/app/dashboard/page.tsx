"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser, getTopTracks, getTopArtists, getRecentlyPlayed, getRecommendations } from "@/lib/spotify"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSpotifyFunction = async (functionName: string, func: () => Promise<any>) => {
    setLoading(true)
    try {
      const result = await func()
      setTestResult({ function: functionName, data: result })
      console.log(`${functionName} result:`, result)
    } catch (error) {
      setTestResult({ function: functionName, error: error.message })
      console.error(`${functionName} error:`, error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Melody</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name}!
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🎵 Test Spotify Functions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => testSpotifyFunction("getCurrentUser", getCurrentUser)}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Get User Profile
                </button>
                <button
                  onClick={() => testSpotifyFunction("getTopTracks", () => getTopTracks("short_term", 10))}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Top Tracks (4 weeks)
                </button>
                <button
                  onClick={() => testSpotifyFunction("getTopArtists", () => getTopArtists("medium_term", 10))}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Top Artists (6 months)
                </button>
                <button
                  onClick={() => testSpotifyFunction("getRecentlyPlayed", () => getRecentlyPlayed(10))}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Recently Played
                </button>
                <button
                  onClick={() => testSpotifyFunction("getRecommendations", () => getRecommendations(undefined, undefined, ["pop", "rock"]))}
                  disabled={loading}
                  className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Recommendations
                </button>
                <button
                  onClick={() => setTestResult(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Clear Results
                </button>
              </div>
              
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                  <span className="ml-2 text-gray-600">Testing...</span>
                </div>
              )}

              {testResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Result for: {testResult.function}
                  </h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-auto max-h-96 border">
                    {testResult.error ? 
                      `Error: ${testResult.error}` : 
                      JSON.stringify(testResult.data, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}