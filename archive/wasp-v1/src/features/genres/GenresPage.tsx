'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Tv, Star, Play, Calendar, Grid, Filter } from 'lucide-react';
import Header2 from '../../components/mvpblocks/header';

interface Genre {
  id: number;
  name: string;
}

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export default function GenresPage() {
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [content, setContent] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const TMDB_API_KEY = '9b0eaa970893512ec6b66c8add587944';
        
        // Fetch movie genres
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
        );
        
        // Fetch TV genres
        const tvResponse = await fetch(
          `https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`
        );
        
        if (!movieResponse.ok || !tvResponse.ok) {
          throw new Error('Failed to fetch genres');
        }
        
        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();
        
        setMovieGenres(movieData.genres || []);
        setTvGenres(tvData.genres || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load genres');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchContentByGenre = async () => {
      if (!selectedGenre) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const TMDB_API_KEY = '9b0eaa970893512ec6b66c8add587944';
        const mediaType = selectedMediaType;
        const genreId = selectedGenre.id;
        
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const data = await response.json();
        setContent(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentByGenre();
  }, [selectedGenre, selectedMediaType]);

  const currentGenres = selectedMediaType === 'movie' ? movieGenres : tvGenres;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
      <Header2 />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Genres
              </h1>
              <p className="text-xl md:text-2xl text-green-100 mb-8">
                Explore content by your favorite genres
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Grid className="h-4 w-4" />
                  <span>{movieGenres.length + tvGenres.length} Genres</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Film className="h-4 w-4" />
                  <span>Movies & TV</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="h-4 w-4" />
                  <span>Popular Content</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Media Type Filter */}
        <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <motion.button
                onClick={() => setSelectedMediaType('movie')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedMediaType === 'movie'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Film className="h-4 w-4" />
                <span>Movies</span>
              </motion.button>
              <motion.button
                onClick={() => setSelectedMediaType('tv')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedMediaType === 'tv'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tv className="h-4 w-4" />
                <span>TV Shows</span>
              </motion.button>
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentGenres.map((genre) => (
                <motion.button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre)}
                  className={`p-4 rounded-lg font-medium transition-all duration-200 ${
                    selectedGenre?.id === genre.id
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {genre.name}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Grid */}
        {selectedGenre && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedGenre.name} {selectedMediaType === 'movie' ? 'Movies' : 'TV Shows'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover the best {selectedGenre.name.toLowerCase()} content
                </p>
              </motion.div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <Grid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Unable to load content</h3>
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  >
                    {content.map((item, index) => (
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
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              {selectedMediaType === 'movie' ? (
                                <Film className="h-12 w-12 text-gray-400" />
                              ) : (
                                <Tv className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors duration-200">
                              <Play className="h-6 w-6" />
                            </button>
                          </div>

                          {/* Rating */}
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                              <Star className="h-3 w-3 text-white fill-current" />
                              <span className="text-white text-xs font-medium">
                                {item.vote_average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          
                          {item.release_date && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(item.release_date).getFullYear()}</span>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {item.overview}
                          </p>

                          {/* CTA Button */}
                          <div className="mt-4">
                            <a
                              href="/signup"
                              className="block w-full text-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                            >
                              Learn More
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Empty State */}
                  {content.length === 0 && !isLoading && (
                    <div className="text-center py-20">
                      <Grid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No content found</h3>
                      <p className="text-gray-500">Try selecting a different genre</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Find Your Perfect Genre?
              </h2>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Create your account to get personalized genre recommendations and discover content tailored to your tastes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Get Started Free
                </a>
                <a
                  href="/login"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors duration-200"
                >
                  Sign In
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
} 