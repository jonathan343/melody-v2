import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// In-memory cache for artist information
const artistCache = new Map<string, { data: ArtistInfo; timestamp: number }>()

interface ArtistInfo {
  summary: string
  background: string
  style: string
  achievements: string
  funFact: string
}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function POST(request: NextRequest) {
  try {
    const { artistName } = await request.json()

    if (!artistName) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = artistName.toLowerCase().trim()
    const cached = artistCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached data for artist: ${artistName}`)
      return NextResponse.json({ 
        ...cached.data, 
        cached: true 
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log(`Fetching artist info for: ${artistName}`)

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `You are a music expert providing concise, engaging information about artists. Respond with a JSON object containing:
          - "summary": A 2-3 sentence overview of the artist
          - "background": 2-3 sentences about their origin, career start, or key background info
          - "style": 1-2 sentences describing their musical style and influences
          - "achievements": 2-3 notable achievements, awards, or milestones
          - "funFact": One interesting or lesser-known fact about the artist
          
          Keep each field concise but informative. Focus on verified, well-known information.`
        },
        {
          role: "user",
          content: `Tell me about the musical artist: ${artistName}`
        }
      ],
      reasoning_effort: "minimal",
      max_completion_tokens: 600,
      response_format: { type: "json_object" }
    })
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    let artistInfo
    try {
      artistInfo = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid response format from OpenAI')
    }

    // Cache the response
    artistCache.set(cacheKey, {
      data: artistInfo,
      timestamp: Date.now()
    })

    // Clean up old cache entries (simple cleanup)
    if (artistCache.size > 100) {
      const oldestKeys = Array.from(artistCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(([key]) => key)
      
      oldestKeys.forEach(key => artistCache.delete(key))
    }

    return NextResponse.json({
      ...artistInfo,
      cached: false
    })

  } catch (error) {
    console.error('Error fetching artist info:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch artist information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
