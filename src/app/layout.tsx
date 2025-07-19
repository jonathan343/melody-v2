import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Melody - Your Personal Music Insights Dashboard",
  description: "Track your Spotify listening stats, get AI-powered insights about your favorite artists, analyze lyric themes, and generate shareable summaries of your music taste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="spotify-sdk-setup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.onSpotifyWebPlaybackSDKReady = () => {
                console.log('Spotify SDK Ready - callback fired');
                window.spotifySDKReady = true;
                if (window.initializeSpotifyPlayer) {
                  window.initializeSpotifyPlayer();
                }
              };
            `,
          }}
        />
        <Script
          src="https://sdk.scdn.co/spotify-player.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
