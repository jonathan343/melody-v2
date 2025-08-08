import { getSession } from "next-auth/react"

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1"

export function isPlaybackFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PLAYBACK_FEATURE === "true"
}

export async function getSpotifyApi() {
  const session = await getSession()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session as any)?.accessToken) {
    throw new Error("No Spotify access token available")
  }

  return {
    get: async (endpoint: string) => {
      const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`)
      }

      return response.json()
    }
  }
}

export async function getCurrentUser() {
  const api = await getSpotifyApi()
  return api.get("/me")
}

export async function getTopTracks(timeRange: "short_term" | "medium_term" | "long_term" = "medium_term", limit: number = 20) {
  const api = await getSpotifyApi()
  return api.get(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
}

export async function getTopArtists(timeRange: "short_term" | "medium_term" | "long_term" = "medium_term", limit: number = 20) {
  const api = await getSpotifyApi()
  return api.get(`/me/top/artists?time_range=${timeRange}&limit=${limit}`)
}

export async function getRecentlyPlayed(limit: number = 20) {
  const api = await getSpotifyApi()
  return api.get(`/me/player/recently-played?limit=${limit}`)
}

export async function getRecommendations(seedTracks?: string[], seedArtists?: string[], seedGenres?: string[], limit: number = 20) {
  const api = await getSpotifyApi()
  const params = new URLSearchParams()
  
  if (seedTracks?.length) params.append("seed_tracks", seedTracks.join(","))
  if (seedArtists?.length) params.append("seed_artists", seedArtists.join(","))
  if (seedGenres?.length) params.append("seed_genres", seedGenres.join(","))
  params.append("limit", limit.toString())
  
  return api.get(`/recommendations?${params.toString()}`)
}