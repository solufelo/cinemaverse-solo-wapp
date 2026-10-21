import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number;
  movieTitle: string;
  mediaType: 'movie' | 'tv';
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export default function TrailerModal({ isOpen, onClose, movieId, movieTitle, mediaType }: TrailerModalProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && movieId) {
      fetchVideos();
    }
  }, [isOpen, movieId]);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the correct TMDB API key
      const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${movieId}/videos?api_key=9b0eaa970893512ec6b66c8add587944`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${data.status_message || 'Unknown error'}`);
      }
      
      const trailers = data.results.filter((video: Video) => 
        video.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser')
      );
      
      setVideos(trailers);
      if (trailers.length > 0) {
        setSelectedVideo(trailers[0]);
      } else {
        setError('No trailers found for this title');
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setError('Failed to load trailers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('trailer-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handleShare = async () => {
    if (!selectedVideo) return;
    
    const url = `https://www.youtube.com/watch?v=${selectedVideo.key}`;
    const text = `Check out the trailer for ${movieTitle}!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: movieTitle,
          text: text,
          url: url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        alert('Trailer link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Play className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {movieTitle} - Trailers
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedVideo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Share
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row">
            {/* Video Player */}
            <div className="flex-1">
              {isLoading ? (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    <button
                      onClick={fetchVideos}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : selectedVideo ? (
                <div className="relative aspect-video">
                  <iframe
                    id="trailer-iframe"
                    src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0`}
                    title={selectedVideo.name}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No trailers available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            {videos.length > 1 && (
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">More Videos</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {videos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          selectedVideo?.id === video.id
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="text-sm font-medium">{video.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {video.type}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 