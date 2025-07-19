"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface ArtistInfo {
  summary: string
  background: string
  style: string
  achievements: string
  funFact: string
}

interface ArtistInfoModalProps {
  isOpen: boolean
  onClose: () => void
  artistName: string
  artistImage?: string
  artistSpotifyUrl?: string
}

export default function ArtistInfoModal({ isOpen, onClose, artistName, artistImage, artistSpotifyUrl }: ArtistInfoModalProps) {
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArtistInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    setArtistInfo(null)

    try {
      const response = await fetch('/api/ai/artist-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artistName }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch artist information')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setArtistInfo(data)
    } catch (err) {
      console.error('Error fetching artist info:', err)
      setError(err instanceof Error ? err.message : 'Failed to load artist information')
    } finally {
      setLoading(false)
    }
  }, [artistName])

  useEffect(() => {
    if (isOpen && artistName) {
      fetchArtistInfo()
    }
  }, [isOpen, artistName, fetchArtistInfo])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[80vh] sm:max-h-[85vh] overflow-y-auto mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
            {artistImage && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative flex-shrink-0">
                <Image
                  src={artistImage}
                  alt={artistName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 truncate">{artistName}</h2>
              <p className="text-white/70 text-xs sm:text-sm mb-2 sm:mb-3">Artist Information</p>
              {/* Open in Spotify button */}
              {artistSpotifyUrl && (
                <a
                  href={artistSpotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.48.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.08 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span className="hidden xs:inline sm:inline">Open in Spotify</span>
                  <span className="xs:hidden sm:hidden">Spotify</span>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 ml-4"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                <span className="text-white/80">Loading artist information...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-100">{error}</span>
              </div>
              <button
                onClick={fetchArtistInfo}
                className="mt-3 bg-red-500/30 hover:bg-red-500/50 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {artistInfo && (
            <div className="space-y-6">
              {/* Two-column layout on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Overview */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl p-4 sm:p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">🎵</span>
                      Overview
                    </h3>
                    <p className="text-white/85 leading-relaxed font-medium text-sm sm:text-base">{artistInfo.summary}</p>
                  </div>

                  {/* Musical Style */}
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl p-4 sm:p-5 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">🎸</span>
                      Musical Style
                    </h3>
                    <p className="text-white/85 leading-relaxed font-medium text-sm sm:text-base">{artistInfo.style}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Background */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl p-4 sm:p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">📖</span>
                      Background
                    </h3>
                    <p className="text-white/85 leading-relaxed font-medium text-sm sm:text-base">{artistInfo.background}</p>
                  </div>

                  {/* Achievements */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-4 sm:p-5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">🏆</span>
                      Notable Achievements
                    </h3>
                    <p className="text-white/85 leading-relaxed font-medium text-sm sm:text-base">{artistInfo.achievements}</p>
                  </div>
                </div>
              </div>

              {/* Fun Fact - Full width */}
              <div className="bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-xl p-4 sm:p-5 border border-pink-500/30 hover:border-pink-500/50 transition-all duration-300">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center justify-center">
                  <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">✨</span>
                  Fun Fact
                </h3>
                <p className="text-white/85 leading-relaxed font-medium text-sm sm:text-base text-center">{artistInfo.funFact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 p-3 sm:p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg text-sm sm:text-base transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}