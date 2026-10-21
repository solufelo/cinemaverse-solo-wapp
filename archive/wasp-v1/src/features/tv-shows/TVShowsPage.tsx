'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'wasp/client/operations';
import { getTrendingContent } from 'wasp/client/operations';
import { addToWatchlist } from 'wasp/client/operations';
import { Play, Star, Calendar, Tv, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrailerModal from '../../shared/components/TrailerModal';
import Header2 from '../../components/mvpblocks/header';

interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

interface TMDBResponse {
  results: TVShow[];
}

export default function TVShowsPage() {
  const [selectedShow, setSelectedShow] = useState<{ id: number; title: string } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  
  const { data: tvShows, isLoading, error } = useQuery(getTrendingContent) as { 
    data: TMDBResponse | undefined; 
    isLoading: boolean; 
    error: any; 
  };

  const handlePlayClick = (show: TVShow) => {
    setSelectedShow({ id: show.id, title: show.name });
    setShowTrailer(true);
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setSelectedShow(null);
  };

  const handleAddToWatchlist = async (show: TVShow) => {
    try {
      await addToWatchlist({
        tmdbId: show.id,
        mediaType: 'TV_SHOW',
        title: show.name,
        posterPath: show.poster_path || undefined,
        overview: show.overview || '',
        genres: [],
        releaseDate: show.first_air_date || undefined
      });
      alert(`${show.name} added to your watchlist!`);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add to watchlist. Please try again.');
    }
  };

  // Filter to only show TV shows
  const tvResults = tvShows?.results?.filter(item => item.media_type === 'tv') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-20">
              <Tv className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load TV Shows</h2>
              <p className="text-gray-600 dark:text-gray-400">We're having trouble loading TV shows right now. Please try again later.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Trending TV Shows
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover the most popular TV shows right now
              </p>
            </motion.div>

            {/* TV Shows Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {tvResults.map((show: TVShow, index: number) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Poster - Clickable to go to details */}
                  <Link to={`/tv/${show.id}`}>
                    <div className="relative aspect-[2/3] overflow-hidden">
                      {show.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                          alt={show.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <Tv className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Overlay with Play Button */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePlayClick(show);
                          }}
                          className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors duration-200 hover:scale-110"
                        >
                          <Play className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 text-white fill-current" />
                          <span className="text-white text-xs font-medium">
                            {show.vote_average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {show.name}
                    </h3>
                    
                    {show.first_air_date && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(show.first_air_date).getFullYear()}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                      {show.overview}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePlayClick(show)}
                        className="flex items-center justify-center w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Trailer
                      </button>
                      
                      <button
                        onClick={() => handleAddToWatchlist(show)}
                        className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Watchlist
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Empty State */}
            {tvResults.length === 0 && (
              <div className="text-center py-20">
                <Tv className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No TV shows found</h3>
                <p className="text-gray-500 dark:text-gray-500">Try refreshing the page</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Trailer Modal */}
      {selectedShow && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={handleCloseTrailer}
          movieId={selectedShow.id}
          movieTitle={selectedShow.title}
          mediaType="tv"
        />
      )}
    </>
  );
} 