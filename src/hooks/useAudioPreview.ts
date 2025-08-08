import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPreviewState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export function useAudioPreview() {
  const [state, setState] = useState<AudioPreviewState>({
    currentTrackId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  const playPreview = useCallback(async (trackId: string, previewUrl: string | null) => {
    // If no preview URL available, do nothing
    if (!previewUrl) {
      return;
    }

    // If this track is already playing, pause it
    if (state.currentTrackId === trackId && state.isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
      return;
    }

    // If this track is paused, resume it
    if (state.currentTrackId === trackId && !state.isPlaying) {
      if (audioRef.current) {
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
      return;
    }

    // Stop current audio if playing a different track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clear existing interval
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(previewUrl);
    audioRef.current = audio;

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setState(prev => ({
        ...prev,
        currentTrackId: trackId,
        duration: audio.duration,
        currentTime: 0
      }));
    });

    audio.addEventListener('play', () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      
      // Start time update interval
      timeUpdateIntervalRef.current = setInterval(() => {
        if (audio.currentTime) {
          setState(prev => ({ ...prev, currentTime: audio.currentTime }));
        }
      }, 1000);
    });

    audio.addEventListener('pause', () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      
      // Clear time update interval
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    });

    audio.addEventListener('ended', () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTrackId: null,
        currentTime: 0,
        duration: 0
      }));
      
      // Clear time update interval
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      
      audioRef.current = null;
    });

    audio.addEventListener('error', () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTrackId: null,
        currentTime: 0,
        duration: 0
      }));
      
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      
      audioRef.current = null;
    });

    // Start playing
    try {
      setState(prev => ({ ...prev, currentTrackId: trackId }));
      await audio.play();
    } catch (error) {
      console.error('Error playing preview:', error);
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTrackId: null,
        currentTime: 0,
        duration: 0
      }));
    }
  }, [state.currentTrackId, state.isPlaying]);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    setState({
      currentTrackId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    });
  }, []);

  return {
    currentTrackId: state.currentTrackId,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    playPreview,
    stopPreview
  };
}