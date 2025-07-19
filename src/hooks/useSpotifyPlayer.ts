import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import SpotifyPlayerSingleton from '../lib/spotifyPlayerSingleton';
import type { SpotifyWebPlaybackPlayer, SpotifyWebPlaybackTrack } from '../types/spotify-web-playback';

interface ExtendedSession extends Session {
  accessToken?: string;
}

interface PlayerState {
  player: SpotifyWebPlaybackPlayer | null;
  deviceId: string;
  isReady: boolean;
  isActive: boolean;
  currentTrack: SpotifyWebPlaybackTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
}

export function useSpotifyPlayer() {
  const { data: session } = useSession();
  const [playerState, setPlayerState] = useState<PlayerState>({
    player: null,
    deviceId: '',
    isReady: false,
    isActive: false,
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
  });

  const extendedSession = session as ExtendedSession;
  const playerSingleton = SpotifyPlayerSingleton.getInstance();

  useEffect(() => {
    // Subscribe to player state changes
    const unsubscribe = playerSingleton.subscribe((state) => {
      setPlayerState(state);
    });

    // Initialize player if we have a token
    if (extendedSession?.accessToken) {
      playerSingleton.initialize(extendedSession.accessToken);
    }

    return unsubscribe;
  }, [extendedSession?.accessToken, playerSingleton]);

  const playTrack = useCallback(async (trackUri: string) => {
    if (extendedSession?.accessToken) {
      await playerSingleton.playTrack(trackUri, extendedSession.accessToken);
    }
  }, [extendedSession?.accessToken, playerSingleton]);

  const togglePlayback = useCallback(async () => {
    await playerSingleton.togglePlayback();
  }, [playerSingleton]);

  const seekToPosition = useCallback(async (positionMs: number) => {
    await playerSingleton.seekToPosition(positionMs);
  }, [playerSingleton]);

  const nextTrack = useCallback(async () => {
    await playerSingleton.nextTrack();
  }, [playerSingleton]);

  const previousTrack = useCallback(async () => {
    await playerSingleton.previousTrack();
  }, [playerSingleton]);

  return {
    player: playerState.player,
    deviceId: playerState.deviceId,
    isReady: playerState.isReady,
    isActive: playerState.isActive,
    currentTrack: playerState.currentTrack,
    isPlaying: playerState.isPlaying,
    position: playerState.position,
    duration: playerState.duration,
    playTrack,
    pausePlayback: async () => {}, // Deprecated, use togglePlayback
    resumePlayback: async () => {}, // Deprecated, use togglePlayback
    togglePlayback,
    seekToPosition,
    nextTrack,
    previousTrack,
  };
}