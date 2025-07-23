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

    // Create gradient background inspired by Aurora component
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#8B5CF6'); // Purple
    gradient.addColorStop(0.3, '#A855F7'); // Purple-pink
    gradient.addColorStop(0.6, '#06B6D4'); // Cyan
    gradient.addColorStop(1, '#10B981'); // Emerald

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle noise texture for modern look
    const imageData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      imageData.data[i] += noise;     // Red
      imageData.data[i + 1] += noise; // Green
      imageData.data[i + 2] += noise; // Blue
    }
    ctx.putImageData(imageData, 0, 0);

    // Overlay semi-transparent rounded rectangle for content area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    drawRoundedRect(ctx, 60, 100, width - 120, height - 200, 24);
    ctx.fill();

    // Load and draw Melody logo (larger for phone screen)
    try {
      const melodyLogo = await loadImage('/melody.png');
      ctx.drawImage(melodyLogo, width / 2 - 40, 120, 80, 80);
    } catch (error) {
      console.warn('Could not load Melody logo');
    }

    // Title (larger for phone screen)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Melody', width / 2, 240);

    // Time period (larger)
    ctx.font = '36px system-ui, -apple-system, sans-serif';
    ctx.fillText(TIME_RANGE_LABELS[timeRange], width / 2, 290);

    // Load and draw Spotify logo (optimized for phone screen)
    try {
      const spotifyLogo = await loadImage('/spotify-full-logo-white.png');
      const logoWidth = 220;
      const logoHeight = (spotifyLogo.height / spotifyLogo.width) * logoWidth;
      ctx.drawImage(spotifyLogo, width / 2 - logoWidth / 2, 320, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Could not load Spotify logo');
    }

    // Top Songs section header
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText('Top Songs', width / 2, 420);

    // Load album images (reduced to 4 for vertical layout)
    const albumImages: (HTMLImageElement | null)[] = [];
    for (let i = 0; i < Math.min(4, topTracks.length); i++) {
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
      } catch (error) {
        albumImages[i] = null;
      }
    }

    // Draw top tracks (centered for vertical layout with better spacing)
    const trackStartY = 460;
    const itemHeight = 140;
    const imageSize = 80;

    for (let i = 0; i < Math.min(4, topTracks.length); i++) {
      const track = topTracks[i];
      const y = trackStartY + i * itemHeight;

      // Draw album artwork
      if (albumImages[i]) {
        ctx.save();
        drawRoundedRect(ctx, 120, y, imageSize, imageSize, 16);
        ctx.clip();
        ctx.drawImage(albumImages[i]!, 120, y, imageSize, imageSize);
        ctx.restore();
      } else {
        // Draw placeholder if image fails
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
        ctx.fillStyle = colors[i % colors.length];
        drawRoundedRect(ctx, 120, y, imageSize, imageSize, 16);
        ctx.fill();
        
        // Add a music note icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♪', 120 + imageSize / 2, y + imageSize / 2 + 12);
      }

      // Track number (larger for phone screen)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, 70, y + 50);

      // Track name (larger for phone screen)
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      const trackName = track.name.length > 35 ? track.name.substring(0, 35) + '...' : track.name;
      ctx.fillText(trackName, 220, y + 40);

      // Artist name (larger for phone screen)
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const artistName = track.artists[0]?.name || 'Unknown Artist';
      const displayArtist = artistName.length > 40 ? artistName.substring(0, 40) + '...' : artistName;
      ctx.fillText(displayArtist, 220, y + 70);
    }

    // Load artist images (reduced to 4 for vertical layout)
    const artistImages: (HTMLImageElement | null)[] = [];
    for (let i = 0; i < Math.min(4, topArtists.length); i++) {
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
      } catch (error) {
        artistImages[i] = null;
      }
    }

    // Top Artists section header (much more spacing)
    const artistSectionY = trackStartY + (4 * itemHeight) + 120;
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText('Top Artists', width / 2, artistSectionY);

    // Draw top artists (centered below tracks with proper spacing)
    const artistStartY = artistSectionY + 80;
    for (let i = 0; i < Math.min(4, topArtists.length); i++) {
      const artist = topArtists[i];
      const y = artistStartY + i * itemHeight;

      // Draw artist image (square like tracks)
      if (artistImages[i]) {
        ctx.save();
        drawRoundedRect(ctx, 120, y, imageSize, imageSize, 16);
        ctx.clip();
        ctx.drawImage(artistImages[i]!, 120, y, imageSize, imageSize);
        ctx.restore();
      } else {
        // Draw placeholder if image fails (square like tracks)
        const artistColors = ['#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'];
        ctx.fillStyle = artistColors[i % artistColors.length];
        drawRoundedRect(ctx, 120, y, imageSize, imageSize, 16);
        ctx.fill();
        
        // Add a person icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👤', 120 + imageSize / 2, y + imageSize / 2 + 12);
      }

      // Artist number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, 70, y + 50);

      // Artist name (aligned with top songs text)
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'white';
      const artistName = artist.name.length > 30 ? artist.name.substring(0, 30) + '...' : artist.name;
      ctx.fillText(artistName, 220, y + 40);

      // Genre (aligned with top songs text)
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const genre = artist.genres[0] || 'Various';
      const displayGenre = genre.length > 35 ? genre.substring(0, 35) + '...' : genre;
      ctx.fillText(displayGenre, 220, y + 70);
    }

    // Footer with user info (positioned for tall format)
    if (userName) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${userName}'s Music Wrapped`, width / 2, height - 80);
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

      <div className="flex space-x-4">
        <button
          onClick={generateCard}
          disabled={isGenerating}
          className="px-6 py-3 bg-spotify-green text-white font-semibold rounded-full hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Card'}
        </button>

        {cardDataUrls[timeRange] && (
          <>
            <button
              onClick={shareCard}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors"
            >
              Share
            </button>
            <button
              onClick={downloadCard}
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 transition-colors"
            >
              Download
            </button>
          </>
        )}
      </div>
    </div>
  );
}