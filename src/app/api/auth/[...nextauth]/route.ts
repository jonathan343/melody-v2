import NextAuth from "next-auth/next"
import SpotifyProvider from "next-auth/providers/spotify"

const getSpotifyScopes = () => {
  const baseScopes = "user-read-email user-read-private user-top-read"
  const playbackScopes = " user-read-recently-played playlist-read-private streaming user-modify-playback-state"
  
  const isPlaybackEnabled = process.env.ENABLE_PLAYBACK_FEATURE === "true"
  
  return isPlaybackEnabled ? `${baseScopes} ${playbackScopes}` : baseScopes
}

const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: getSpotifyScopes()
        }
      }
    })
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }