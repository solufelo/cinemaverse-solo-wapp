'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Tv, Star, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header2 from '../../components/mvpblocks/header';
import TrailerModal from '../../shared/components/TrailerModal';

// Updated interface to match actual TMDB API response
interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  adult?: boolean;
  video?: boolean;
  original_language?: string;
}

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [movies, setMovies] = useState<TMDBItem[]>([]);
  const [tvShows, setTvShows] = useState<TMDBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; title: string; mediaType: 'movie' | 'tv' } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch trending movies and TV shows
        const [moviesResponse, tvResponse] = await Promise.all([
          fetch('https://api.themoviedb.org/3/trending/movie/week?api_key=9b0eaa970893512ec6b66c8add587944'),
          fetch('https://api.themoviedb.org/3/trending/tv/week?api_key=9b0eaa970893512ec6b66c8add587944')
        ]);

        if (!moviesResponse.ok || !tvResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const moviesData = await moviesResponse.json();
        const tvData = await tvResponse.json();

        // Add media_type to each item
        const moviesWithType = moviesData.results.map((movie: any) => ({
          ...movie,
          media_type: 'movie' as const
        }));
        const tvWithType = tvData.results.map((show: any) => ({
          ...show,
          media_type: 'tv' as const
        }));

        setMovies(moviesWithType);
        setTvShows(tvWithType);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayClick = (item: TMDBItem) => {
    setSelectedItem({ 
      id: item.id, 
      title: getTitle(item), 
      mediaType: item.media_type 
    });
    setShowTrailer(true);
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setSelectedItem(null);
  };

  const displayItems = selectedCategory === 'all' 
    ? [...movies, ...tvShows]
    : selectedCategory === 'movies' 
    ? movies 
    : tvShows;

  const categories = [
    { id: 'all', name: 'All', count: movies.length + tvShows.length, icon: Film },
    { id: 'movies', name: 'Movies', count: movies.length, icon: Film },
    { id: 'tv', name: 'TV Shows', count: tvShows.length, icon: Tv },
  ];

  // Helper function to get the title safely
  const getTitle = (item: TMDBItem) => {
    return item.title || item.name || item.original_title || item.original_name || 'Unknown Title';
  };

  // Helper function to get the release date safely
  const getReleaseDate = (item: TMDBItem) => {
    return item.release_date || item.first_air_date;
  };

  // Helper function to get vote average safely
  const getVoteAverage = (item: TMDBItem) => {
    return item.vote_average || 0;
  };

  return (
    <>
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        
        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 whitespace-nowrap">
                  Discover Amazing Content
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8">
                  Explore the latest movies and TV shows that everyone's talking about
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <Film className="h-4 w-4" />
                    <span>{movies.length} Movies</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <Tv className="h-4 w-4" />
                    <span>{tvShows.length} TV Shows</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <Star className="h-4 w-4" />
                    <span>Top Rated</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Category Filter */}
          <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as any)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.name}</span>
                      <span className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded-full text-xs">
                        {category.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Content Grid */}
          <section className="py-12">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Unable to load content</h3>
                  <p className="text-gray-500">Please try again later</p>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  >
                    {displayItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {/* Poster */}
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {item.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                              alt={getTitle(item)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Film className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Overlay with Play Button */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button 
                              onClick={() => handlePlayClick(item)}
                              className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors duration-200 hover:scale-110"
                            >
                              <Play className="h-6 w-6" />
                            </button>
                          </div>

                          {/* Media Type Badge */}
                          <div className="absolute top-2 left-2">
                            <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                              {item.media_type === 'movie' ? (
                                <Film className="h-3 w-3 text-white" />
                              ) : (
                                <Tv className="h-3 w-3 text-white" />
                              )}
                              <span className="text-white text-xs font-medium capitalize">
                                {item.media_type}
                              </span>
                            </div>
                          </div>

                          {/* Rating */}
                          {getVoteAverage(item) > 0 && (
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                                <Star className="h-3 w-3 text-white fill-current" />
                                <span className="text-white text-xs font-medium">
                                  {getVoteAverage(item).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {getTitle(item)}
                          </h3>
                          
                          {getReleaseDate(item) && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(getReleaseDate(item) || '').getFullYear()}</span>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {item.overview}
                          </p>

                          {/* CTA Buttons */}
                          <div className="mt-4 space-y-2">
                            <button
                              onClick={() => handlePlayClick(item)}
                              className="block w-full text-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                            >
                              Watch Trailer
                            </button>
                            <Link
                              to={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}
                              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Empty State */}
                  {displayItems.length === 0 && (
                    <div className="text-center py-20">
                      <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No content found</h3>
                      <p className="text-gray-500">Try selecting a different category</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Start Your Journey?
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Create your account to save your favorite movies and TV shows, get personalized recommendations, and never miss what's trending.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/signup"
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                  >
                    Get Started Free
                  </a>
                  <a
                    href="/login"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
                  >
                    Sign In
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>

      {/* Trailer Modal */}
      {selectedItem && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={handleCloseTrailer}
          movieId={selectedItem.id}
          movieTitle={selectedItem.title}
          mediaType={selectedItem.mediaType}
        />
      )}
    </>
  );
} 