import type { SpotifyWebPlaybackPlayer } from './spotify-web-playback';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    spotifySDKReady?: boolean;
    initializeSpotifyPlayer?: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyWebPlaybackPlayer;
    };
  }
}

export {};