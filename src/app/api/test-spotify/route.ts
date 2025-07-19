import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getTopTracks, getTopArtists, getRecentlyPlayed } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")

  try {
    let result
    
    switch (endpoint) {
      case "user":
        result = await getCurrentUser()
        break
      case "top-tracks":
        result = await getTopTracks("short_term", 10)
        break
      case "top-artists":
        result = await getTopArtists("medium_term", 10)
        break
      case "recent":
        result = await getRecentlyPlayed(10)
        break
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}