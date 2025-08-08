"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { getTopTracks, getTopArtists, isPlaybackFeatureEnabled } from "@/lib/spotify"
import Image from "next/image"
import Aurora from "@/components/Aurora"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import { useAudioPreview } from "@/hooks/useAudioPreview"
import { useMouseFollow } from "@/hooks/useMouseFollow"
import SpotifyPlayer from "@/components/SpotifyPlayer"
import ArtistInfoModal from "@/components/ArtistInfoModal"
import ShareModal from "@/components/ShareModal"

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string; width: number; height: number }[]
  genres: string[]
  external_urls?: { spotify: string }
}

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  preview_url: string | null
  artists: { name: string }[]
  album: { 
    name: string
    images: { url: string; width: number; height: number }[] 
  }
}

export default function DashboardPage() {
  const { smoothedMousePosition } = useMouseFollow({ smoothingFactor: 0.07 });
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term")
  const [topArtists, setTopArtists] = useState<{ items: SpotifyArtist[] } | null>(null)
  const [topTracks, setTopTracks] = useState<{ items: SpotifyTrack[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("Top Music")
  
  // Artist info modal state
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null)
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false)
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Cache for different time periods using ref to avoid dependency issues
  const cacheRef = useRef<{
    [key: string]: {
      artists: { items: SpotifyArtist[] } | null
      tracks: { items: SpotifyTrack[] } | null
    }
  }>({})
  
  // Refs for scrolling
  const artistsScrollRef = useRef<HTMLDivElement>(null)
  const tracksScrollRef = useRef<HTMLDivElement>(null)
  
  // State for arrow visibility
  const [artistsCanScrollLeft, setArtistsCanScrollLeft] = useState(false)
  const [artistsCanScrollRight, setArtistsCanScrollRight] = useState(true)
  const [tracksCanScrollLeft, setTracksCanScrollLeft] = useState(false)
  const [tracksCanScrollRight, setTracksCanScrollRight] = useState(true)
  
  // Spotify Web Playback SDK (for full playback when feature enabled)
  const { playTrack, togglePlayback, isReady, isPlaying, currentTrack } = useSpotifyPlayer()
  
  // Audio Preview playback (for 30-second previews)
  const { currentTrackId, isPlaying: isPreviewPlaying, playPreview } = useAudioPreview()

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMobileMenuOpen && !target.closest('nav')) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])
  
  const checkScrollability = (element: HTMLDivElement, setCanScrollLeft: (value: boolean) => void, setCanScrollRight: (value: boolean) => void) => {
    const { scrollLeft, scrollWidth, clientWidth } = element
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }
  
  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setCanScrollLeft: (value: boolean) => void, setCanScrollRight: (value: boolean) => void) => {
    if (ref.current) {
      checkScrollability(ref.current, setCanScrollLeft, setCanScrollRight)
    }
  }
  
  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>, setCanScrollLeft: (value: boolean) => void, setCanScrollRight: (value: boolean) => void) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -400, behavior: 'smooth' })
      setTimeout(() => handleScroll(ref, setCanScrollLeft, setCanScrollRight), 300)
    }
  }
  
  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>, setCanScrollLeft: (value: boolean) => void, setCanScrollRight: (value: boolean) => void) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 400, behavior: 'smooth' })
      setTimeout(() => handleScroll(ref, setCanScrollLeft, setCanScrollRight), 300)
    }
  }
  
  // Handle track playback
  const handlePlayTrack = (track: SpotifyTrack) => {
    if (isPlaybackFeatureEnabled()) {
      // Use full Spotify Web Playback SDK when available
      if (!isReady) {
        console.log('Player not ready')
        return
      }
      
      // If this track is currently playing, pause it
      if (isTrackPlaying(track)) {
        togglePlayback()
      } else if (isCurrentTrack(track)) {
        // If this is the current track but paused, resume it
        togglePlayback()
      } else {
        // Otherwise, play this new track
        playTrack(track.uri)
      }
    } else {
      // Use preview playback when full playback is disabled
      playPreview(track.id, track.preview_url)
    }
  }
  
  // Check if a track is currently playing
  const isTrackPlaying = (track: SpotifyTrack) => {
    if (isPlaybackFeatureEnabled()) {
      return isPlaying && currentTrack && currentTrack.id === track.id
    } else {
      return isPreviewPlaying && currentTrackId === track.id
    }
  }
  
  // Check if a track is the current track (playing or paused)
  const isCurrentTrack = (track: SpotifyTrack) => {
    if (isPlaybackFeatureEnabled()) {
      return currentTrack && currentTrack.id === track.id
    } else {
      return currentTrackId === track.id
    }
  }
  
  // Handle artist info modal
  const handleArtistInfo = (artist: SpotifyArtist) => {
    setSelectedArtist(artist)
    setIsArtistModalOpen(true)
  }
  
  const closeArtistModal = () => {
    setIsArtistModalOpen(false)
    setSelectedArtist(null)
  }
  
  // Check initial scroll state when data loads
  useEffect(() => {
    if (topArtists && artistsScrollRef.current) {
      checkScrollability(artistsScrollRef.current, setArtistsCanScrollLeft, setArtistsCanScrollRight)
    }
    if (topTracks && tracksScrollRef.current) {
      checkScrollability(tracksScrollRef.current, setTracksCanScrollLeft, setTracksCanScrollRight)
    }
  }, [topArtists, topTracks])

  const loadSpotifyData = useCallback(async (selectedTimeRange: "short_term" | "medium_term" | "long_term") => {
    // Check if data is already cached
    const cachedData = cacheRef.current[selectedTimeRange]
    if (cachedData?.artists && cachedData?.tracks) {
      console.log(`Using cached data for ${selectedTimeRange}`)
      setTopArtists(cachedData.artists)
      setTopTracks(cachedData.tracks)
      return
    }

    setLoading(true)
    try {
      console.log(`Fetching new data for ${selectedTimeRange}`)
      const [artistsData, tracksData] = await Promise.all([
        getTopArtists(selectedTimeRange, 20),
        getTopTracks(selectedTimeRange, 20)
      ])
      
      // Update state
      setTopArtists(artistsData)
      setTopTracks(tracksData)
      
      // Cache the data in ref
      cacheRef.current = {
        ...cacheRef.current,
        [selectedTimeRange]: {
          artists: artistsData,
          tracks: tracksData
        }
      }
    } catch (error) {
      console.error("Error loading Spotify data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTimeRangeChange = (newTimeRange: "short_term" | "medium_term" | "long_term") => {
    setTimeRange(newTimeRange)
    loadSpotifyData(newTimeRange)
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/")
    } else {
      loadSpotifyData(timeRange)
    }
  }, [session, status, router, timeRange, loadSpotifyData])

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
    <>
      {/* Aurora Background - Fixed to viewport */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#00dbde", "#7209b7", "#fc00ff"]}
          rotationSpeed={1}
          gradientIntensity={0.85}
          gradientSize={1.25}
          turbulence={0.05}
          pulsing={0.03}
          speed={0.5}
          mouseX={smoothedMousePosition.x}
          mouseY={smoothedMousePosition.y}
          mouseInfluence={0.5}
        />
      </div>
      
      <div className="min-h-screen relative bg-transparent" style={{ paddingBottom: '120px' }}>
      
      {/* Content Overlay */}
      <div className="relative z-10">
      {/* Navigation Header */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Image
                  src="/melody.png"
                  alt="Melody Logo"
                  width={40}
                  height={40}
                  className="p-1"
                />
                <h1 className="text-xl font-semibold text-white">Melody</h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                {["Top Music", "Playlists", "Statistics", "Share"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === "Share") {
                        setIsShareModalOpen(true)
                      } else {
                        setActiveTab(tab)
                      }
                    }}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-white hover:text-white/80 transition-all duration-300 p-2 rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6 transition-transform duration-300 ease-in-out"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: isMobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                      className="transition-opacity duration-200"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                      className="transition-opacity duration-200"
                    />
                  )}
                </svg>
              </button>
              
              {/* Desktop Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden md:block bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 backdrop-blur-sm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-black/30 backdrop-blur-sm border-b border-white/10">
            {["Top Music", "Playlists", "Statistics", "Share"].map((tab, index) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Share") {
                    setIsShareModalOpen(true)
                  } else {
                    setActiveTab(tab)
                  }
                  setIsMobileMenuOpen(false) // Close menu after selection
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ease-out transform ${
                  isMobileMenuOpen 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-2 opacity-0'
                } ${
                  activeTab === tab 
                    ? "bg-white/20 text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ 
                  transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : '0ms'
                }}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ease-out transform ${
                isMobileMenuOpen 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-2 opacity-0'
              } text-white/70 hover:text-white hover:bg-white/10`}
              style={{ 
                transitionDelay: isMobileMenuOpen ? '200ms' : '0ms'
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Time Range Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 inline-flex">
            {[
              { key: "long_term", label: "All Time" },
              { key: "medium_term", label: "Past 6 Months" },
              { key: "short_term", label: "Past Month" }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTimeRangeChange(key as "short_term" | "medium_term" | "long_term")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timeRange === key
                    ? "bg-white/30 text-white shadow-lg"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Spotify Player Status */}
        {isPlaybackFeatureEnabled() && !isReady && (
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />
                <span className="text-yellow-100 text-sm">
                  Initializing Spotify Web Player... Make sure you have Spotify Premium to play tracks.
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-red-500/70 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                >
                  Re-authenticate
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            <span className="ml-4 text-white text-lg">Loading your music...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Artists Section */}
            {topArtists && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <Image src="/spotify-logo-white.png" alt="Spotify" width={30} height={30} />
                  <h2 className="text-3xl font-semibold text-white">Top Artists</h2>
                </div>
                <div className="relative group">
                  {/* Left Arrow */}
                  {artistsCanScrollLeft && (
                    <button
                      onClick={() => scrollLeft(artistsScrollRef, setArtistsCanScrollLeft, setArtistsCanScrollRight)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Scroll left"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Right Arrow */}
                  {artistsCanScrollRight && (
                    <button
                      onClick={() => scrollRight(artistsScrollRef, setArtistsCanScrollLeft, setArtistsCanScrollRight)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Scroll right"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  <div 
                    ref={artistsScrollRef} 
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
                    style={{ 
                      scrollSnapType: 'x mandatory', 
                      padding: '8px 12px',
                      scrollPaddingLeft: '12px',
                      scrollPaddingRight: '12px'
                    }}
                    onScroll={() => handleScroll(artistsScrollRef, setArtistsCanScrollLeft, setArtistsCanScrollRight)}
                  >
                    {topArtists.items?.map((artist: SpotifyArtist, index: number) => (
                    <div key={artist.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 hover:scale-105 transition-all duration-200 cursor-pointer flex-none w-48" style={{ scrollSnapAlign: 'start' }}>
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-sm lg:rounded-md">
                        {artist.images?.[0] ? (
                          <Image
                            src={artist.images[0].url}
                            alt={artist.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 rounded-sm lg:rounded-md flex items-center justify-center">
                            <span className="text-white/50 text-2xl">🎤</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm mb-1">{index + 1}. {artist.name}</p>
                        <button 
                          onClick={() => handleArtistInfo(artist)}
                          className="bg-purple-500/70 hover:bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200"
                        >
                          About
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Tracks Section */}
            {topTracks && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <Image src="/spotify-logo-white.png" alt="Spotify" width={30} height={30} />
                  <h2 className="text-3xl font-semibold text-white">Top Tracks</h2>
                </div>
                <div className="relative group">
                  {/* Left Arrow */}
                  {tracksCanScrollLeft && (
                    <button
                      onClick={() => scrollLeft(tracksScrollRef, setTracksCanScrollLeft, setTracksCanScrollRight)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Scroll left"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Right Arrow */}
                  {tracksCanScrollRight && (
                    <button
                      onClick={() => scrollRight(tracksScrollRef, setTracksCanScrollLeft, setTracksCanScrollRight)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Scroll right"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  <div 
                    ref={tracksScrollRef} 
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
                    style={{ 
                      scrollSnapType: 'x mandatory', 
                      padding: '8px 12px',
                      scrollPaddingLeft: '12px',
                      scrollPaddingRight: '12px'
                    }}
                    onScroll={() => handleScroll(tracksScrollRef, setTracksCanScrollLeft, setTracksCanScrollRight)}
                  >
                    {topTracks.items?.map((track: SpotifyTrack, index: number) => (
                    <div key={track.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 hover:scale-105 transition-all duration-200 cursor-pointer flex-none w-48" style={{ scrollSnapAlign: 'start' }}>
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-sm lg:rounded-md">
                        {track.album?.images?.[0] ? (
                          <Image
                            src={track.album.images[0].url}
                            alt={track.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 rounded-sm lg:rounded-md flex items-center justify-center">
                            <span className="text-white/50 text-2xl">🎵</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm mb-1 truncate">{index + 1}. {track.name}</p>
                        <p className="text-white/70 text-xs mb-2 truncate">{track.artists?.[0]?.name}</p>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePlayTrack(track);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          disabled={isPlaybackFeatureEnabled() && !isReady}
                          className={`p-3 rounded-full transition-all duration-200 group touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto ${
                            isPlaybackFeatureEnabled() && !isReady 
                              ? "bg-gray-500/50 text-gray-300 cursor-not-allowed" 
                              : isTrackPlaying(track)
                              ? "bg-green-500/80 text-white hover:bg-green-500 active:bg-green-600"
                              : "bg-white/20 text-white hover:bg-white/30 active:bg-white/40"
                          }`}
                          style={{ touchAction: 'manipulation' }}
                          aria-label={isTrackPlaying(track) ? "Currently playing" : "Play track"}
                        >
                          {isPlaybackFeatureEnabled() && !isReady ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                          ) : isTrackPlaying(track) ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="m7 4 10 6L7 16V4z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      </div>
      
      {/* Spotify Player */}
      <SpotifyPlayer />
      
      {/* Artist Info Modal */}
      <ArtistInfoModal
        isOpen={isArtistModalOpen}
        onClose={closeArtistModal}
        artistName={selectedArtist?.name || ''}
        artistImage={selectedArtist?.images?.[0]?.url}
        artistSpotifyUrl={selectedArtist?.external_urls?.spotify}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        topTracks={topTracks?.items?.slice(0, 10) || []}
        topArtists={topArtists?.items?.slice(0, 10) || []}
        timeRange={timeRange}
        userName={session?.user?.name || undefined}
      />
      </div>
    </>
  )
}