'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Star, Film, Tv } from 'lucide-react';
import { useQuery } from 'wasp/client/operations';
import { getTrendingContent } from 'wasp/client/operations';

interface TMDBItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  media_type: 'movie' | 'tv';
  vote_average?: number;
}

export default function TMDBCarousel() {
  const { data: trendingData, isLoading, error } = useQuery(getTrendingContent);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const items = trendingData?.results || [];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !items.length) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load trending content</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex] as TMDBItem;

  return (
    <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Background Image */}
      {currentItem.poster_path && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${currentItem.poster_path})`,
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl ml-0 lg:ml-8">
            {/* Media Type Badge */}
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4 mb-4"
            >
              <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                {currentItem.media_type === 'movie' ? (
                  <Film className="h-4 w-4 text-blue-400" />
                ) : (
                  <Tv className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-blue-400 text-sm font-medium capitalize">
                  {currentItem.media_type}
                </span>
              </div>
              {currentItem.vote_average && (
                <div className="flex items-center space-x-1 bg-yellow-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-yellow-400 text-sm font-medium">
                    {currentItem.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              key={`title-${currentItem.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight pr-20"
            >
              {currentItem.title}
            </motion.h2>

            {/* Overview */}
            <motion.p
              key={`overview-${currentItem.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-200 text-lg mb-6 line-clamp-3 pr-20"
            >
              {currentItem.overview}
            </motion.p>

            {/* Release Date */}
            {currentItem.release_date && (
              <motion.div
                key={`date-${currentItem.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-gray-300 mb-6"
              >
                Released: {new Date(currentItem.release_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.div
              key={`cta-${currentItem.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <a
                href="/search"
                className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                <Play className="h-5 w-5" />
                <span>Learn More</span>
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Positioned outside content area */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors duration-200 backdrop-blur-sm z-30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors duration-200 backdrop-blur-sm z-30"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {items.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Pause/Play Button */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-200 backdrop-blur-sm z-20"
        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isAutoPlaying ? (
          <div className="w-4 h-4 border-2 border-white border-l-transparent rounded-full animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
    </div>
  );
} 