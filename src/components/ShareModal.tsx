'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { getTopTracks, getTopArtists } from '@/lib/spotify';
import ShareableCard from './ShareableCard';

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

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function ShareModal({ 
  isOpen, 
  onClose, 
  topTracks, 
  topArtists, 
  timeRange, 
  userName 
}: ShareModalProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [dataCache, setDataCache] = useState<Record<string, { tracks: Track[], artists: Artist[] }>>({});

  useEffect(() => {
    setSelectedTimeRange(timeRange);
    // Initialize cache with current data only if not already cached
    setDataCache(prev => {
      if (!prev[timeRange]) {
        return {
          ...prev,
          [timeRange]: { tracks: topTracks, artists: topArtists }
        };
      }
      return prev;
    });
  }, [timeRange]);

  const fetchDataForTimeRange = async (range: 'short_term' | 'medium_term' | 'long_term') => {
    // If data is already cached, don't fetch again
    if (dataCache[range]) {
      return;
    }

    try {
      // Fetch both tracks and artists for the selected time range using lib functions
      const [tracksData, artistsData] = await Promise.all([
        getTopTracks(range, 20),
        getTopArtists(range, 20)
      ]);
      
      setDataCache(prev => ({
        ...prev,
        [range]: { 
          tracks: tracksData?.items || [], 
          artists: artistsData?.items || [] 
        }
      }));
    } catch (error) {
      console.error('Error fetching data for time range:', range, error);
    }
  };

  const handleTimeRangeChange = (range: 'short_term' | 'medium_term' | 'long_term') => {
    setSelectedTimeRange(range);
    // Fetch data asynchronously without blocking the UI
    fetchDataForTimeRange(range).catch(error => {
      console.error('Failed to fetch data for time range:', range, error);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Share Your Music</h2>
                <p className="text-gray-400">Create a beautiful card of your top tracks and artists</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Time Range Selector */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Time Period</h3>
            <div className="flex space-x-2">
              {[
                { key: "long_term", label: "All Time" },
                { key: "medium_term", label: "Past 6 Months" },
                { key: "short_term", label: "Past Month" }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTimeRangeChange(key as 'short_term' | 'medium_term' | 'long_term')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTimeRange === key
                      ? 'bg-spotify-green text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Preview & Generate</h3>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <ShareableCard
                topTracks={dataCache[selectedTimeRange]?.tracks?.length > 0 
                  ? dataCache[selectedTimeRange].tracks 
                  : (selectedTimeRange === timeRange ? topTracks : [])}
                topArtists={dataCache[selectedTimeRange]?.artists?.length > 0 
                  ? dataCache[selectedTimeRange].artists 
                  : (selectedTimeRange === timeRange ? topArtists : [])}
                timeRange={selectedTimeRange}
                userName={userName}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl p-6 border border-purple-500/20">
            <h4 className="text-lg font-semibold text-white mb-3">Sharing Tips</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start space-x-2">
                <span className="text-spotify-green mt-1">•</span>
                <span>Cards are generated in high resolution (1200x1600px) perfect for social media</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-spotify-green mt-1">•</span>
                <span>Use the Share button to post directly to social platforms or copy to clipboard</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-spotify-green mt-1">•</span>
                <span>Download button saves the card as a PNG file to your device</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-spotify-green mt-1">•</span>
                <span>Switch time periods to see different versions of your music taste</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}