import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import { addToWatchlist } from 'wasp/client/operations';
import { getTVDetails } from 'wasp/client/operations';
import { Play, Star, Calendar, Clock, Heart, Share2, Users, Tv } from 'lucide-react';
import { Button } from '../../components/ui/button';
import TrailerModal from '../../shared/components/TrailerModal';
import ShareButton from '../../shared/components/ShareButton';
import { AISummary } from '../../shared/components/AIContent';

export default function TVDetailsPage() {
  const { tvId } = useParams();
  const { data: user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const { data: tvData, isLoading, error } = useQuery(getTVDetails, { 
    id: parseInt(tvId || '0') 
  });

  const handleAddToWatchlist = async () => {
    if (!user) {
      alert('Please log in to add TV shows to your watchlist');
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      await addToWatchlist({
        tmdbId: parseInt(tvId || '0'),
        mediaType: 'TV_SHOW',
        title: tvData?.name || '',
        posterPath: tvData?.poster_path || undefined,
        overview: tvData?.overview || '',
        genres: tvData?.genres?.map((g: { id: number; name: string }) => g.name) || [],
        releaseDate: tvData?.first_air_date
      });
      alert('Added to watchlist!');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add to watchlist. Please try again.');
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleWatchTrailer = () => {
    setShowTrailer(true);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !tvData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Tv className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">TV Show Not Found</h2>
          <p className="text-gray-400">The TV show you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative">
          {/* Background Image */}
          {tvData.backdrop_path && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/original${tvData.backdrop_path})`,
              }}
            >
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Poster */}
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-64 h-96 rounded-lg overflow-hidden shadow-2xl"
                  >
                    {tvData.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${tvData.poster_path}`}
                        alt={tvData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Tv className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* TV Show Info */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {/* Title and Year */}
                    <div className="mb-4">
                      <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                        {tvData.name}
                      </h1>
                      {tvData.first_air_date && (
                        <p className="text-xl text-gray-300">
                          {new Date(tvData.first_air_date).getFullYear()}
                        </p>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300">
                      {tvData.episode_run_time && tvData.episode_run_time[0] && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatRuntime(tvData.episode_run_time[0])}</span>
                        </div>
                      )}
                      
                      {tvData.vote_average && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{tvData.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      
                      {tvData.vote_count && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{tvData.vote_count.toLocaleString()} votes</span>
                        </div>
                      )}

                      {tvData.number_of_seasons && (
                        <div className="flex items-center space-x-1">
                          <Tv className="h-4 w-4" />
                          <span>{tvData.number_of_seasons} season{tvData.number_of_seasons !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tvData.genres?.map((genre: { id: number; name: string }) => (
                        <span
                          key={genre.id}
                          className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>

                    {/* Overview */}
                    <p className="text-gray-200 mb-6 leading-relaxed max-w-3xl">
                      {tvData.overview}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleWatchTrailer}
                        className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Trailer
                      </Button>
                      
                      {user && (
                        <Button
                          onClick={handleAddToWatchlist}
                          disabled={isAddingToWatchlist}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          {isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
                        </Button>
                      )}
                      
                      <ShareButton
                        title={tvData.name}
                        url={window.location.href}
                        description={tvData.overview}
                        variant="outline"
                        className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {/* Tab Navigation */}
            <div className="flex space-x-8 mb-6 border-b border-white/20">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'cast', label: 'Cast' },
                { id: 'videos', label: 'Videos' },
                { id: 'reviews', label: 'Reviews' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-64">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* AI Summary */}
                  <AISummary
                    title={tvData.name}
                    overview={tvData.overview}
                    mediaType="tv"
                  />
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Details</h3>
                      <div className="space-y-3 text-gray-300">
                        {tvData.first_air_date && (
                          <div className="flex justify-between">
                            <span>First Air Date:</span>
                            <span>{new Date(tvData.first_air_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {tvData.last_air_date && (
                          <div className="flex justify-between">
                            <span>Last Air Date:</span>
                            <span>{new Date(tvData.last_air_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {tvData.number_of_seasons && (
                          <div className="flex justify-between">
                            <span>Seasons:</span>
                            <span>{tvData.number_of_seasons}</span>
                          </div>
                        )}
                        {tvData.number_of_episodes && (
                          <div className="flex justify-between">
                            <span>Episodes:</span>
                            <span>{tvData.number_of_episodes}</span>
                          </div>
                        )}
                        {tvData.status && (
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="capitalize">{tvData.status.toLowerCase()}</span>
                          </div>
                        )}
                        {tvData.type && (
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="capitalize">{tvData.type.toLowerCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Production</h3>
                      <div className="space-y-3 text-gray-300">
                        {tvData.production_companies?.map((company: { id: number; name: string; logo_path?: string }) => (
                          <div key={company.id} className="flex items-center space-x-2">
                            {company.logo_path && (
                              <img
                                src={`https://image.tmdb.org/t/p/w45${company.logo_path}`}
                                alt={company.name}
                                className="h-6 w-auto"
                              />
                            )}
                            <span>{company.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cast' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Cast</h3>
                  {tvData.credits?.cast ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {tvData.credits.cast.slice(0, 12).map((person: { id: number; name: string; character: string; profile_path?: string }) => (
                        <div key={person.id} className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-600">
                            {person.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                alt={person.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate">{person.name}</p>
                          <p className="text-xs text-gray-400 truncate">{person.character}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No cast information available.</p>
                  )}
                </div>
              )}

              {activeTab === 'videos' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Videos</h3>
                  {tvData.videos?.results && tvData.videos.results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tvData.videos.results
                        .filter((video: { site: string; type: string }) => video.site === 'YouTube' && video.type === 'Trailer')
                        .slice(0, 4)
                        .map((video: { id: string; key: string; name: string }) => (
                          <div key={video.id} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.key}`}
                              title={video.name}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No videos available for this TV show.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Reviews</h3>
                  {tvData.reviews?.results && tvData.reviews.results.length > 0 ? (
                    <div className="space-y-4">
                      {tvData.reviews.results.slice(0, 5).map((review: { id: string; author: string; content: string; author_details: { rating?: number } }) => (
                        <div key={review.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{review.author}</h4>
                            {review.author_details.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-300">{review.author_details.rating}/10</span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm line-clamp-3">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No reviews available for this TV show.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        movieId={parseInt(tvId || '0')}
        movieTitle={tvData.name}
        mediaType="tv"
      />
    </>
  );
} 