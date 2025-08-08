'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
}

interface Artist {
  id: string;
  name: string;
  images: Array<{ url: string; width: number; height: number }>;
  genres: string[];
}

interface ShareableCardProps {
  topTracks: Track[];
  topArtists: Artist[];
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  userName?: string;
}

const TIME_RANGE_LABELS = {
  short_term: 'Past Month',
  medium_term: 'Past 6 Months',
  long_term: 'All Time'
};

export default function ShareableCard({ topTracks, topArtists, timeRange, userName }: ShareableCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardDataUrls, setCardDataUrls] = useState<Record<string, string>>({});

  const loadImageAsBase64 = async (src: string): Promise<string> => {
    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(src)}&format=base64`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch image: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.dataUrl;
    } catch (error) {
      console.error('Error in loadImageAsBase64:', error);
      throw error;
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Use the native browser Image constructor explicitly
      const img = document.createElement('img') as HTMLImageElement;
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };
      
      img.src = src;
    });
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const generateCard = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    

    // Set canvas size for Instagram Stories (9:16 aspect ratio)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Create a cleaner gradient background with better contrast
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e'); // Dark navy
    gradient.addColorStop(0.5, '#16213e'); // Medium navy
    gradient.addColorStop(1, '#0f3460'); // Deep blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay for texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < width; i += 4) {
      for (let j = 0; j < height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // Header section with brand
    const headerHeight = 300;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, headerHeight);

    // Load and draw Melody logo
    try {
      const melodyLogo = await loadImage('/melody.png');
      ctx.drawImage(melodyLogo, width / 2 - 50, 50, 100, 100);
    } catch {
      console.warn('Could not load Melody logo');
    }

    // Title with shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Melody', width / 2, 220);

    // Time period with better contrast
    ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#1DB954'; // Spotify green
    ctx.fillText(TIME_RANGE_LABELS[timeRange], width / 2, 270);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Load album images for top 5 tracks
    const albumImages: (HTMLImageElement | null)[] = [];
    for (let i = 0; i < Math.min(5, topTracks.length); i++) {
      const track = topTracks[i];
      try {
        const albumImageUrl = track.album.images[0]?.url;
        if (albumImageUrl) {
          const base64DataUrl = await loadImageAsBase64(albumImageUrl);
          const albumImage = await loadImage(base64DataUrl);
          albumImages[i] = albumImage;
        } else {
          albumImages[i] = null;
        }
      } catch {
        albumImages[i] = null;
      }
    }

    // Top Songs section with expanded height
    const songsStartY = 340;
    const sectionHeight = 700;
    
    // Songs background with rounded corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    drawRoundedRect(ctx, 40, songsStartY, width - 80, sectionHeight, 20);
    ctx.fill();

    // Section header with larger font
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Top Songs', width / 2, songsStartY + 70);

    // Draw top 5 tracks with better spacing
    const trackItemHeight = 120;
    const trackStartY = songsStartY + 100;
    const imageSize = 70;

    for (let i = 0; i < Math.min(5, topTracks.length); i++) {
      const track = topTracks[i];
      const y = trackStartY + i * trackItemHeight;

      // Alternating background for better separation
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(60, y - 10, width - 120, trackItemHeight - 20);
      }

      // Track number as bold white text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, 100, y + imageSize / 2 + 16);

      // Album artwork with larger size
      const albumX = 140;
      if (albumImages[i]) {
        ctx.save();
        drawRoundedRect(ctx, albumX, y, imageSize, imageSize, 16);
        ctx.clip();
        ctx.drawImage(albumImages[i]!, albumX, y, imageSize, imageSize);
        ctx.restore();
      } else {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        ctx.fillStyle = colors[i % colors.length];
        drawRoundedRect(ctx, albumX, y, imageSize, imageSize, 16);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '36px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♪', albumX + imageSize / 2, y + imageSize / 2 + 12);
      }

      // Track name with larger typography
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const trackName = track.name.length > 22 ? track.name.substring(0, 22) + '...' : track.name;
      ctx.fillText(trackName, 250, y + 35);

      // Artist name with larger font
      ctx.font = '34px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#B3B3B3';
      const artistName = track.artists[0]?.name || 'Unknown Artist';
      const displayArtist = artistName.length > 26 ? artistName.substring(0, 26) + '...' : artistName;
      ctx.fillText(displayArtist, 250, y + 75);
    }

    // Load artist images for top 5 artists
    const artistImages: (HTMLImageElement | null)[] = [];
    for (let i = 0; i < Math.min(5, topArtists.length); i++) {
      const artist = topArtists[i];
      try {
        const artistImageUrl = artist.images[0]?.url;
        if (artistImageUrl) {
          const base64DataUrl = await loadImageAsBase64(artistImageUrl);
          const artistImage = await loadImage(base64DataUrl);
          artistImages[i] = artistImage;
        } else {
          artistImages[i] = null;
        }
      } catch {
        artistImages[i] = null;
      }
    }

    // Top Artists section with expanded height
    const artistsStartY = songsStartY + sectionHeight + 40;
    const artistsSectionHeight = 700;
    
    // Artists background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    drawRoundedRect(ctx, 40, artistsStartY, width - 80, artistsSectionHeight, 20);
    ctx.fill();

    // Section header with larger font
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎤 Top Artists', width / 2, artistsStartY + 70);

    // Draw top 5 artists
    const artistItemHeight = 120;
    const artistStartY = artistsStartY + 100;

    for (let i = 0; i < Math.min(5, topArtists.length); i++) {
      const artist = topArtists[i];
      const y = artistStartY + i * artistItemHeight;

      // Alternating background
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(60, y - 10, width - 120, artistItemHeight - 20);
      }

      // Artist number as bold white text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, 100, y + imageSize / 2 + 16);

      // Artist image (square like tracks) with larger size
      const artistX = 140;
      if (artistImages[i]) {
        ctx.save();
        drawRoundedRect(ctx, artistX, y, imageSize, imageSize, 16);
        ctx.clip();
        ctx.drawImage(artistImages[i]!, artistX, y, imageSize, imageSize);
        ctx.restore();
      } else {
        const artistColors = ['#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'];
        ctx.fillStyle = artistColors[i % artistColors.length];
        drawRoundedRect(ctx, artistX, y, imageSize, imageSize, 16);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👤', artistX + imageSize / 2, y + imageSize / 2 + 12);
      }

      // Artist name properly centered vertically
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const artistName = artist.name.length > 20 ? artist.name.substring(0, 20) + '...' : artist.name;
      ctx.fillText(artistName, 250, y + imageSize / 2 + 18);
    }

    // Footer with better spacing
    if (userName) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${userName}'s Music Wrapped`, width / 2, height - 60);
    }

    // Convert canvas to data URL and store for current time range
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setCardDataUrls(prev => ({ ...prev, [timeRange]: dataUrl }));
    setIsGenerating(false);
  };

  const downloadCard = () => {
    const currentCardUrl = cardDataUrls[timeRange];
    if (!currentCardUrl) return;

    const link = document.createElement('a');
    link.download = `melody-${timeRange}-${Date.now()}.png`;
    link.href = currentCardUrl;
    link.click();
  };

  const shareCard = async () => {
    const currentCardUrl = cardDataUrls[timeRange];
    if (!currentCardUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(currentCardUrl);
      const blob = await response.blob();
      
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'melody-card.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'My Melody Music Card',
          text: `Check out my ${TIME_RANGE_LABELS[timeRange].toLowerCase()} music stats!`,
          files: [new File([blob], 'melody-card.png', { type: 'image/png' })]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('Card copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing card:', error);
      downloadCard(); // Fallback to download
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {cardDataUrls[timeRange] && (
        <div className="relative">
          <Image
            src={cardDataUrls[timeRange]}
            alt="Shareable Music Card"
            width={400}
            height={533}
            className="rounded-2xl shadow-2xl"
          />
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={generateCard}
          disabled={isGenerating}
          className="px-4 py-2 bg-spotify-green text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Card'}
        </button>

        {cardDataUrls[timeRange] && (
          <>
            <button
              onClick={shareCard}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Share
            </button>
            <button
              onClick={downloadCard}
              className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              Download
            </button>
          </>
        )}
      </div>
    </div>
  );
}