export interface SpotifyWebPlaybackPlayer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: (event: string, callback: (data?: any) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener: (event: string, callback?: (data?: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyWebPlaybackState | null>;
  getVolume: () => Promise<number>;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

export interface SpotifyWebPlaybackState {
  context: {
    uri: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyWebPlaybackTrack;
    next_tracks: SpotifyWebPlaybackTrack[];
    previous_tracks: SpotifyWebPlaybackTrack[];
  };
}

export interface SpotifyWebPlaybackTrack {
  uri: string;
  id: string;
  type: 'track' | 'episode' | 'ad';
  media_type: 'audio' | 'video';
  name: string;
  is_playable: boolean;
  duration_ms: number;
  album: {
    uri: string;
    name: string;
    images: { url: string }[];
  };
  artists: { uri: string; name: string }[];
}

export interface SpotifyWebPlaybackDevice {
  device_id: string;
  name: string;
  type: string;
  volume_percent: number;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
}

