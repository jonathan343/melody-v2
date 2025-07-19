import type { SpotifyWebPlaybackPlayer, SpotifyWebPlaybackState, SpotifyWebPlaybackTrack } from '../types/spotify-web-playback';

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

class SpotifyPlayerSingleton {
  private static instance: SpotifyPlayerSingleton;
  private player: SpotifyWebPlaybackPlayer | null = null;
  private deviceId: string = '';
  private isReady: boolean = false;
  private isActive: boolean = false;
  private currentTrack: SpotifyWebPlaybackTrack | null = null;
  private isPlaying: boolean = false;
  private position: number = 0;
  private duration: number = 0;
  private listeners: Array<(state: PlayerState) => void> = [];
  private initialized: boolean = false;

  static getInstance(): SpotifyPlayerSingleton {
    if (!SpotifyPlayerSingleton.instance) {
      SpotifyPlayerSingleton.instance = new SpotifyPlayerSingleton();
    }
    return SpotifyPlayerSingleton.instance;
  }

  subscribe(listener: (state: PlayerState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.getState());
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): PlayerState {
    return {
      player: this.player,
      deviceId: this.deviceId,
      isReady: this.isReady,
      isActive: this.isActive,
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      position: this.position,
      duration: this.duration,
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private setState(updates: Partial<PlayerState>) {
    if (updates.deviceId !== undefined) this.deviceId = updates.deviceId;
    if (updates.isReady !== undefined) this.isReady = updates.isReady;
    if (updates.isActive !== undefined) this.isActive = updates.isActive;
    if (updates.currentTrack !== undefined) this.currentTrack = updates.currentTrack;
    if (updates.isPlaying !== undefined) this.isPlaying = updates.isPlaying;
    if (updates.position !== undefined) this.position = updates.position;
    if (updates.duration !== undefined) this.duration = updates.duration;
    if (updates.player !== undefined) this.player = updates.player;
    
    this.notifyListeners();
  }

  async initialize(accessToken: string) {
    if (this.initialized) {
      console.log('Spotify player singleton already initialized');
      return;
    }

    console.log('Initializing Spotify player singleton...');
    this.initialized = true;

    const initializePlayer = () => {
      console.log('Creating Spotify Player instance...');
      
      if (!window.Spotify) {
        console.error('Spotify SDK not available');
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Melody Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          console.log('Spotify requesting OAuth token...');
          cb(accessToken);
        },
        volume: 0.5,
      });

      // Ready event
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Player Ready with Device ID', device_id);
        this.setState({ deviceId: device_id, isReady: true, player: spotifyPlayer });
        this.transferPlaybackToDevice(device_id, accessToken);
      });

      // Not Ready event
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        this.setState({ isReady: false });
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyWebPlaybackState) => {
        if (!state) return;

        this.setState({
          currentTrack: state.track_window.current_track,
          isPlaying: !state.paused,
          position: state.position,
          duration: state.track_window.current_track?.duration_ms || 0,
        });
      });

      // Error listeners
      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Spotify Authentication error:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Spotify Account error (Premium required?):', message);
      });

      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Spotify Initialization error:', message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Spotify Playback error:', message);
      });

      // Connect to the player
      spotifyPlayer.connect();
    };

    // Set up global initialization
    window.initializeSpotifyPlayer = initializePlayer;

    // Check if SDK is ready
    if (window.Spotify) {
      console.log('Spotify SDK already available');
      initializePlayer();
    } else if (window.spotifySDKReady) {
      console.log('Spotify SDK ready flag is set');
      initializePlayer();
    } else {
      console.log('Waiting for Spotify SDK to load...');
    }
  }

  private async transferPlaybackToDevice(deviceId: string, accessToken: string) {
    try {
      console.log('Transferring playback to device:', deviceId);
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        console.log('Successfully transferred playback to device');
      }
    } catch (error) {
      console.log('Playback transfer error (this is often normal):', error);
    }
  }

  async playTrack(trackUri: string, accessToken: string) {
    if (!accessToken || !this.deviceId) {
      console.error('No access token or device ID available');
      return;
    }

    try {
      console.log('Making play request to Spotify API...');
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Spotify play API error:', errorText);
      } else {
        console.log('Successfully sent play request to Spotify');
      }
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  }

  async togglePlayback() {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  async seekToPosition(positionMs: number) {
    if (this.player) {
      await this.player.seek(positionMs);
    }
  }

  async nextTrack() {
    if (this.player) {
      await this.player.nextTrack();
    }
  }

  async previousTrack() {
    if (this.player) {
      await this.player.previousTrack();
    }
  }
}

export default SpotifyPlayerSingleton;