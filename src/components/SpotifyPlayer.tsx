"use client"

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import Image from "next/image"
import { useState, useEffect } from "react"

// Helper function to format time in mm:ss
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function SpotifyPlayer() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    isReady,
    togglePlayback,
    seekToPosition,
    nextTrack,
    previousTrack,
  } = useSpotifyPlayer()

  const [localPosition, setLocalPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Update local position when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition(position)
    }
  }, [position, isDragging])

  // Auto-increment position when playing and not dragging
  useEffect(() => {
    if (isPlaying && !isDragging) {
      const interval = setInterval(() => {
        setLocalPosition(prev => Math.min(prev + 1000, duration))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPlaying, isDragging, duration])

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const percentage = (event.clientX - rect.left) / rect.width
    const newPosition = Math.max(0, Math.min(percentage * duration, duration))
    
    setLocalPosition(newPosition)
    seekToPosition(newPosition)
  }

  const handleProgressMouseDown = () => {
    setIsDragging(true)
  }

  const handleProgressMouseUp = () => {
    setIsDragging(false)
  }

  // Show player when ready, even without a current track
  if (!isReady) {
    return null
  }

  // If no current track, show a minimal player
  if (!currentTrack) {
    return (
      <div className="spotify-player" style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.85))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 1000,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <p className="text-white/70 text-sm">
              🎵 Spotify player ready - Click play on any track to start listening
            </p>
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage = duration > 0 ? (localPosition / duration) * 100 : 0

  return (
    <div className="spotify-player" style={{ 
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.85))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 1000,
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {currentTrack?.album?.images?.[0] && (
              <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
                <Image
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {currentTrack?.name}
              </p>
              <p className="text-white/70 text-xs truncate">
                {currentTrack?.artists?.map((artist) => artist.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={previousTrack}
              className="text-white/70 hover:text-white transition-colors duration-200 p-2"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button
              onClick={togglePlayback}
              className="bg-white text-black hover:bg-white/90 transition-colors duration-200 p-3 rounded-full"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m7 4 10 6L7 16V4z"/>
                </svg>
              )}
            </button>
            
            <button
              onClick={nextTrack}
              className="text-white/70 hover:text-white transition-colors duration-200 p-2"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Progress Bar and Time */}
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            <span className="text-white/70 text-xs font-mono min-w-[40px]">
              {formatTime(localPosition)}
            </span>
            
            <div 
              className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative group hover:h-1.5 transition-all duration-150"
              onClick={handleSeek}
              onMouseDown={handleProgressMouseDown}
              onMouseUp={handleProgressMouseUp}
            >
              <div 
                className="h-full bg-white group-hover:bg-green-500 rounded-full transition-all duration-150"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150"
                style={{ 
                  left: `${progressPercentage}%`, 
                  transform: 'translateX(-50%) translateY(-50%)'
                }}
              />
            </div>
            
            <span className="text-white/70 text-xs font-mono min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}