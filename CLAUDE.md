# Melody - Music Discovery & Analytics Platform

## Project Overview

Melody is a personal music insight dashboard powered by the Spotify API and generative AI. Track your recent listening stats, surface tailored recommendations, analyze lyric themes, and spot patterns across your favorite artists and genres. Instantly generate a beautifully formatted, shareable summary image to post or save—all in one place.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom WebGL Aurora background component
- **Storage**: NextAuth.js sessions + in-memory caching
- **Authentication**: NextAuth.js with Spotify OAuth
- **API Integration**: Spotify Web API + Spotify Web Playback SDK
- **Music Playback**: Full track playback with seek, play/pause, next/previous controls
- **Graphics**: WebGL-powered Aurora background with OGL library
- **AI Integration**: OpenAI GPT-4o-mini for artist information and analysis
- **Image Generation**: Canvas API or similar for shareable summaries (planned)
- **Deployment**: Vercel (for optimal Next.js integration and secure environment variables)

## Architecture Design

### Core Features

1. **User Authentication & Spotify Integration**
   - Spotify OAuth login via NextAuth.js
   - Token management for Spotify API calls
   - User session management

2. **Music Analytics Dashboard**
   - Interactive Netflix-style horizontal carousels for top tracks and artists
   - Time-based analytics with toggle buttons (Past Month, Past 6 Months, All Time)
   - Smart caching system to avoid re-fetching data
   - WebGL Aurora animated background with music-themed colors
   - Responsive design with smooth hover animations
   - Navigation arrows that auto-hide at carousel edges

3. **Music Playback Controls**
   - Full track playback via Spotify Web Playback SDK
   - Play/pause functionality with smart state management (available for all users)
   - **Conditional controls based on Spotify subscription:**
     - **Premium users**: Full controls including seek bar, next/previous track navigation
     - **Free users**: Limited to play/pause only (following Spotify UX guidelines)
   - Real-time playback position tracking
   - Subscription status indicator in player UI
   - Helpful tooltips explaining Premium-only features for Free users
   - Resume/pause for currently loaded tracks

4. **AI-Powered Insights**
   - Artist background and detailed information via GPT-4o-mini
   - Comprehensive artist summaries, musical style analysis, and achievements
   - Smart caching system for AI responses (24-hour cache duration)
   - Interactive modals with detailed artist information and fun facts
   - Lyric analysis and sentiment detection (planned)
   - Musical taste pattern recognition (planned)
   - Genre exploration and recommendations (planned)

5. **Personalized Recommendations**
   - Spotify-based recommendations
   - AI-enhanced suggestions based on listening patterns
   - Discovery of new artists and genres

6. **Shareable Content Generation**
   - Auto-generated summary images
   - Social media ready graphics
   - Customizable themes and layouts

### Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # NextAuth configuration
│   │   ├── spotify/        # Spotify API routes
│   │   └── ai/            # OpenAI integration routes
│   ├── dashboard/         # Main dashboard pages
│   ├── profile/           # User profile management
│   └── share/             # Shareable content pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── charts/            # Data visualization components (planned)
│   ├── auth/              # Authentication components
│   ├── Aurora.tsx         # WebGL Aurora background component
│   ├── SpotifyPlayer.tsx  # Main music player UI component
│   ├── ArtistInfoModal.tsx # Artist information modal with AI integration
│   ├── ShareModal.tsx     # Shareable content modal with time range selection
│   └── ShareableCard.tsx  # Canvas-based shareable card generator
├── hooks/
│   ├── useSpotifyPlayer.ts # Spotify player state management hook
│   └── useSpotifySubscription.ts # Spotify subscription status management hook
├── lib/
│   ├── spotify.ts         # Spotify API client
│   ├── spotifyPlayerSingleton.ts # Singleton pattern for Web Playback SDK
│   ├── openai.ts          # OpenAI API client
│   ├── storage.ts         # Local storage utilities
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
│   ├── spotify-web-playback.d.ts # Spotify Web Playback SDK types
│   └── global.d.ts        # Global window type extensions
└── styles/                # Global styles and Tailwind config
```

### API Routes

- `/api/auth/[...nextauth]` - NextAuth.js authentication with Spotify OAuth
- `/api/test-spotify` - Development endpoint for testing Spotify API functions
- **Spotify API Integration** (via lib/spotify.ts):
  - `getCurrentUser()` - User's Spotify profile
  - `getUserSubscription()` - User's subscription status (free/premium)
  - `getTopTracks()` - Top tracks with time range support
  - `getTopArtists()` - Top artists with time range support
  - `getRecentlyPlayed()` - Recently played tracks
  - `getRecommendations()` - Spotify recommendations
- `/api/ai/artist-info` - AI-powered artist information using GPT-4o-mini
- `/api/proxy-image` - CORS-safe image proxy for Spotify CDN images with base64 conversion
- `/api/ai/analyze-lyrics` - AI lyric analysis (planned)
- `/api/ai/music-trends` - AI trend analysis (planned)

### Data Storage Strategy

**No Database Required** - Using client-side storage and sessions:

- **User Authentication**: NextAuth.js sessions with Spotify OAuth
- **Spotify Data**: Real-time API calls with intelligent in-memory caching by time range
- **Data Caching**: Smart caching prevents unnecessary API calls when switching time periods
- **AI Insights**: Server-side in-memory caching with 24-hour expiration for artist information
- **User Preferences**: localStorage for theme, settings (planned)
- **Shareable Content**: Generated on-demand, no persistence needed (planned)

**Spotify API Client** (`lib/spotify.ts`):
```typescript
// Main Spotify API client with authentication
export async function getSpotifyApi() { ... }

// User data functions
export async function getCurrentUser() { ... }
export async function getTopTracks(timeRange, limit) { ... }
export async function getTopArtists(timeRange, limit) { ... }
export async function getRecentlyPlayed(limit) { ... }
export async function getRecommendations(seedTracks, seedArtists, seedGenres, limit) { ... }
```

**Spotify Web Playback SDK** (`lib/spotifyPlayerSingleton.ts`):
```typescript
// Singleton pattern for managing Web Playback SDK instance
class SpotifyPlayerSingleton {
  async initialize(accessToken: string) { ... }
  async playTrack(trackUri: string, accessToken: string) { ... }
  async togglePlayback() { ... }
  async seekToPosition(positionMs: number) { ... }
  async nextTrack() { ... }
  async previousTrack() { ... }
  subscribe(listener: (state: PlayerState) => void) { ... }
}
```

**Player Hook** (`hooks/useSpotifyPlayer.ts`):
```typescript
export function useSpotifyPlayer() {
  // Returns: player state, playback controls, and real-time position tracking
  return {
    player, deviceId, isReady, isActive, currentTrack, isPlaying, position, duration,
    playTrack, togglePlayback, seekToPosition, nextTrack, previousTrack
  }
}
```

**Storage Utilities** (`lib/storage.ts`) - Planned:
```typescript
// Cache Spotify data temporarily
export const cacheSpotifyData = (key: string, data: any, ttl: number) => { ... }
export const getCachedSpotifyData = (key: string) => { ... }
```

### Environment Variables

**Development (.env.local):**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
OPENAI_API_KEY=your-openai-api-key
```

**Production (Vercel Environment Variables):**
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-production-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
OPENAI_API_KEY=your-openai-api-key
```

**Security Note**: Vercel automatically encrypts environment variables and keeps them secure from build artifacts, unlike some other deployment platforms.

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Key Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "next-auth": "^4.24.0",
  "tailwindcss": "^3.3.0",
  "ogl": "^1.0.0",
  "openai": "^4.0.0",
  "recharts": "^2.8.0",
  "lucide-react": "^0.400.0"
}
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Configure Spotify App in Spotify Developer Dashboard
5. Start development server: `npm run dev`

## Implementation Status

### ✅ Completed Features
- Spotify OAuth authentication via NextAuth.js with required scopes for playback
- WebGL Aurora animated background with customizable colors and performance optimizations
- Netflix-style horizontal scrolling carousels for music data with hover scaling
- Time period toggles (Past Month, Past 6 Months, All Time)
- Smart caching system to prevent unnecessary API calls
- Responsive design with smooth animations and fixed layout clipping
- Navigation arrows with edge detection (auto-hide when at start/end)
- TypeScript implementation with proper type safety
- Next.js Image optimization with proper Spotify CDN configuration
- **AI-Powered Artist Information**:
  - ChatGPT integration using GPT-4o-mini model
  - Interactive artist information modals with detailed summaries
  - Artist background, musical style, achievements, and fun facts
  - Smart caching system with 24-hour cache duration
  - Comprehensive error handling and loading states
  - Responsive modal design with glass-morphism effects
  - Color-coded sections with icons for better visual hierarchy
  - Two-column layout on desktop, single-column on mobile
  - "Open in Spotify" button with direct artist page links
  - Mobile-optimized modal with proper spacing and typography
- **Spotify Web Playback SDK Integration**:
  - Full track playback with Spotify Premium accounts
  - Play/pause functionality with smart state management (available for all users)
  - **Conditional Controls Based on Subscription Type**:
    - **Premium users**: Full controls including interactive seek bar and next/previous navigation
    - **Free users**: Play/pause only controls (following Spotify UX guidelines)
    - Visual differentiation with disabled state styling for restricted controls
    - Helpful tooltips explaining Premium-only features
    - Subscription status indicator in player UI
  - Real-time playback position tracking with live progress display
  - Resume/pause for currently loaded tracks
  - Sticky bottom player with glass-morphism design
  - Interactive progress bar with Spotify green hover effects (Premium only)
  - Real-time position updates with smooth seek functionality (Premium only)
  - Singleton pattern for efficient player instance management
  - Smart resume/restart logic for enhanced user experience
  - Mobile-optimized play buttons with proper touch targets (44px minimum)
  - Touch event optimization to prevent conflicts with card interactions
- **Shareable Content Generation**:
  - Canvas-based high-quality image generation for social media sharing
  - Instagram Stories format (1080x1920px) optimized for mobile platforms
  - Aurora-inspired gradient backgrounds with subtle noise texture for modern aesthetics
  - Time range-specific card generation (Past Month, Past 6 Months, All Time)
  - Smart data caching per time range to prevent unnecessary API calls
  - CORS-safe image proxy API for loading Spotify CDN images in Canvas
  - Square album artwork and artist images with rounded corners
  - Consistent typography and spacing optimized for readability
  - Native Web Share API integration with clipboard fallback
  - Download functionality for saving cards locally
  - Glass-morphism modal design with proper z-index management
  - Responsive time range selector with visual feedback
  - Production-ready with comprehensive error handling

### 🚧 In Progress/Planned
- Extended AI-powered music analysis (lyrics, sentiment, trends)
- Additional music analytics and visualizations
- User preferences and customization
- Enhanced recommendation system

## Configuration Notes

### Spotify Setup
- Ensure Spotify OAuth app has correct redirect URIs configured
- Add `http://localhost:3000/api/auth/callback/spotify` for development
- For production: Add your Vercel domain (e.g., `https://your-app.vercel.app/api/auth/callback/spotify`)
- **Required OAuth Scopes**: `user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private streaming user-modify-playback-state`
- **Spotify Premium Required**: Web Playback SDK requires Spotify Premium subscription for full functionality
- **Subscription-Based Features**: App automatically detects subscription type and adjusts available controls accordingly
- Configure Spotify image domains in `next.config.ts`:
  ```typescript
  images: {
    domains: ['i.scdn.co'],
  }
  ```

### Development
- Handle Spotify token refresh automatically via NextAuth.js
- Smart caching implemented to minimize API calls
- Follow Spotify API rate limits and terms of service
- Run `npm run lint` and `npm run typecheck` before committing

### Technical Implementation Notes
- **Singleton Pattern**: Used for Spotify Web Playback SDK to prevent multiple player instances and infinite re-rendering issues
- **Global Callback Bridge**: SDK script loaded in layout.tsx with proper callback setup before SDK initialization
- **Smart Play/Pause Logic**: Distinguishes between playing, paused, and different tracks for intuitive user experience
- **Aurora Component Optimizations**: Empty dependency array prevents WebGL context re-mounting, debounced resize handling
- **Player Positioning**: Inline styles with high z-index ensure reliable sticky positioning across all screen sizes
- **Scroll Clipping Prevention**: Careful padding adjustments (12px) to prevent card hover scaling from being cut off
- **Mobile Touch Optimization**: Enhanced touch event handling with `stopPropagation()` and `touchAction: 'manipulation'`
- **Accessibility Compliance**: 44px minimum touch targets for mobile devices following iOS/Android guidelines
- **NextAuth Redirect Handling**: Custom redirect callback for mobile Safari OAuth compatibility

### Performance Optimizations
- In-memory caching prevents re-fetching data when switching time periods
- Next.js Image component with proper sizing for Spotify images
- WebGL Aurora component optimized for smooth 60fps animations
- Horizontal scrolling with smooth behavior and scroll snapping
- Optimized scroll padding to prevent card clipping during hover scaling
- Debounced resize events for Aurora component to prevent excessive WebGL calls
- Fixed positioning for Aurora background to cover full viewport without cutoff
- Glass-morphism player design with backdrop blur effects
- Mobile-responsive design with optimized touch interactions and proper spacing
- Event handling optimization to prevent touch conflicts between cards and buttons