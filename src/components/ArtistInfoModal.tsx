"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface ArtistInfo {
  summary: string
  background: string
  style: string
  achievements: string
  funFact: string
  cached?: boolean
}

interface ArtistInfoModalProps {
  isOpen: boolean
  onClose: () => void
  artistName: string
  artistImage?: string
}

export default function ArtistInfoModal({ isOpen, onClose, artistName, artistImage }: ArtistInfoModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-4">
            {artistImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src={artistImage}
                  alt={artistName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-white">{artistName}</h2>
              <p className="text-white/70 text-sm">Artist Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
              {artistInfo.cached && (
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-blue-100 text-sm">Loaded from cache</span>
                  </div>
                </div>
              )}

              {/* Overview */}
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <span className="mr-3 text-2xl">🎵</span>
                  Overview
                </h3>
                <p className="text-white/85 leading-relaxed font-medium">{artistInfo.summary}</p>
              </div>

              {/* Background */}
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <span className="mr-3 text-2xl">📖</span>
                  Background
                </h3>
                <p className="text-white/85 leading-relaxed font-medium">{artistInfo.background}</p>
              </div>

              {/* Musical Style */}
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <span className="mr-3 text-2xl">🎸</span>
                  Musical Style
                </h3>
                <p className="text-white/85 leading-relaxed font-medium">{artistInfo.style}</p>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-500/20">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <span className="mr-3 text-2xl">🏆</span>
                  Notable Achievements
                </h3>
                <p className="text-white/85 leading-relaxed font-medium">{artistInfo.achievements}</p>
              </div>

              {/* Fun Fact */}
              <div className="bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-lg p-4 border border-pink-500/30">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <span className="mr-3 text-2xl">✨</span>
                  Fun Fact
                </h3>
                <p className="text-white/85 leading-relaxed font-medium">{artistInfo.funFact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}