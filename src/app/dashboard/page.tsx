"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { getTopTracks, getTopArtists } from "@/lib/spotify"
import Image from "next/image"
import Aurora from "@/components/Aurora"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import SpotifyPlayer from "@/components/SpotifyPlayer"

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
}

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term")
  const [topArtists, setTopArtists] = useState<{ items: SpotifyArtist[] } | null>(null)
  const [topTracks, setTopTracks] = useState<{ items: SpotifyTrack[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("Top Music")
  
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
  
  // Spotify Web Playback SDK
  const { playTrack, togglePlayback, isReady, isPlaying, currentTrack } = useSpotifyPlayer()
  
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
  }
  
  // Check if a track is currently playing
  const isTrackPlaying = (track: SpotifyTrack) => {
    return isPlaying && currentTrack && currentTrack.id === track.id
  }
  
  // Check if a track is the current track (playing or paused)
  const isCurrentTrack = (track: SpotifyTrack) => {
    return currentTrack && currentTrack.id === track.id
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
          rotationSpeed={0.75}
          gradientIntensity={1.0}
          gradientSize={1.2}
          turbulence={0.25}
          pulsing={0.000}
          speed={1.0}
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
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎵</span>
                </div>
                <h1 className="text-xl font-semibold text-white">Melody</h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-6">
                {["Top Music", "Playlists", "Statistics", "Share"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 backdrop-blur-sm"
              >
                Log out
              </button>
            </div>
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
        {!isReady && (
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
                <div className="flex items-center space-x-3 mb-6">
                  <Image src="/spotify-logo-white.png" alt="Spotify" width={24} height={24} />
                  <h2 className="text-2xl font-semibold text-white">Top Artists</h2>
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
                    style={{ scrollSnapType: 'x mandatory' }}
                    onScroll={() => handleScroll(artistsScrollRef, setArtistsCanScrollLeft, setArtistsCanScrollRight)}
                  >
                    {topArtists.items?.map((artist: SpotifyArtist, index: number) => (
                    <div key={artist.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 hover:scale-105 transition-all duration-200 cursor-pointer flex-none w-48" style={{ scrollSnapAlign: 'start' }}>
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                        {artist.images?.[0] ? (
                          <Image
                            src={artist.images[0].url}
                            alt={artist.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center">
                            <span className="text-white/50 text-2xl">🎤</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm mb-1">{index + 1}. {artist.name}</p>
                        <button className="bg-purple-500/70 hover:bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200">
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
                <div className="flex items-center space-x-3 mb-6">
                  <Image src="/spotify-logo-white.png" alt="Spotify" width={24} height={24} />
                  <h2 className="text-2xl font-semibold text-white">Top Tracks</h2>
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
                    style={{ scrollSnapType: 'x mandatory' }}
                    onScroll={() => handleScroll(tracksScrollRef, setTracksCanScrollLeft, setTracksCanScrollRight)}
                  >
                    {topTracks.items?.map((track: SpotifyTrack, index: number) => (
                    <div key={track.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 hover:scale-105 transition-all duration-200 cursor-pointer flex-none w-48" style={{ scrollSnapAlign: 'start' }}>
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                        {track.album?.images?.[0] ? (
                          <Image
                            src={track.album.images[0].url}
                            alt={track.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center">
                            <span className="text-white/50 text-2xl">🎵</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm mb-1 truncate">{index + 1}. {track.name}</p>
                        <p className="text-white/70 text-xs mb-2 truncate">{track.artists?.[0]?.name}</p>
                        <button 
                          onClick={() => handlePlayTrack(track)}
                          disabled={!isReady}
                          className={`p-2 rounded-full transition-all duration-200 group ${
                            !isReady 
                              ? "bg-gray-500/50 text-gray-300 cursor-not-allowed" 
                              : isTrackPlaying(track)
                              ? "bg-green-500/80 text-white hover:bg-green-500"
                              : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
                          }`}
                          aria-label={isTrackPlaying(track) ? "Currently playing" : "Play track"}
                        >
                          {!isReady ? (
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
      </div>
    </>
  )
}