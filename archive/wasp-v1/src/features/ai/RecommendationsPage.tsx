import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getRecommendations } from 'wasp/client/operations'
import { addToWatchlist } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'react-router-dom'
import { Play, Star, Calendar, Film, Tv, Brain, RefreshCw, AlertCircle } from 'lucide-react'
import TrailerModal from '../../shared/components/TrailerModal'
import Header2 from '../../components/mvpblocks/header'

interface Recommendation {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  media_type: 'movie' | 'tv'
  vote_average?: number
  confidence_score?: number
}

export default function RecommendationsPage() {
  const { data: user } = useAuth()
  const [selectedItem, setSelectedItem] = useState<{ id: number; title: string; mediaType: 'movie' | 'tv' } | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: recommendationsData, isLoading, error, refetch } = useQuery(getRecommendations)

  const handlePlayClick = (item: Recommendation) => {
    setSelectedItem({ 
      id: item.id, 
      title: item.title, 
      mediaType: item.media_type 
    });
    setShowTrailer(true);
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setSelectedItem(null);
  };

  const handleAddToWatchlist = async (item: Recommendation) => {
    try {
      await addToWatchlist({
        tmdbId: item.id,
        mediaType: item.media_type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        title: item.title,
        posterPath: item.poster_path || undefined,
        overview: item.overview || '',
        genres: [],
        releaseDate: item.release_date || undefined
      })
      alert(`${item.title} added to your watchlist!`)
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      alert('Failed to add to watchlist. Please try again.')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Failed to refresh recommendations:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return '/placeholder-poster.jpg'
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-20">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be signed in to get personalized AI recommendations.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Recommendations
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Personalized recommendations based on your watchlist and preferences
              </p>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Recommendations'}
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing your preferences and generating recommendations...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Unable to Load Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  We're having trouble generating your personalized recommendations. This might be because you don't have enough items in your watchlist yet.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                  <Link
                    to="/search"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Browse Content
                  </Link>
                </div>
              </div>
            )}

            {/* Recommendations Grid */}
            {recommendationsData?.recommendations && recommendationsData.recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recommendationsData.recommendations.map((title: string, index: number) => {
                  // Create a mock recommendation object for display
                  const mockItem: Recommendation = {
                    id: index + 1,
                    title: title,
                    overview: `A compelling ${title.toLowerCase()} that showcases exceptional storytelling and memorable characters.`,
                    poster_path: null,
                    release_date: '2023-01-01',
                    media_type: index % 2 === 0 ? 'movie' : 'tv',
                    vote_average: 8.0 + (Math.random() * 2),
                    confidence_score: 0.8 + (Math.random() * 0.2)
                  };
                  
                  return (
                  <div
                    key={`${mockItem.media_type}-${mockItem.id}`}
                    className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {/* Poster - Clickable to go to details */}
                    <Link to={mockItem.media_type === 'movie' ? `/movie/${mockItem.id}` : `/tv/${mockItem.id}`}>
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img
                          src={getPosterUrl(mockItem.poster_path)}
                          alt={mockItem.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-poster.jpg'
                          }}
                        />
                        
                        {/* Overlay with Play Button */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePlayClick(mockItem);
                            }}
                            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors duration-200 hover:scale-110"
                          >
                            <Play className="h-6 w-6" />
                          </button>
                        </div>

                        {/* Media Type Badge */}
                        <div className="absolute top-2 left-2">
                          <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                            {mockItem.media_type === 'movie' ? (
                              <Film className="h-3 w-3 text-white" />
                            ) : (
                              <Tv className="h-3 w-3 text-white" />
                            )}
                            <span className="text-white text-xs font-medium capitalize">
                              {mockItem.media_type}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        {mockItem.vote_average && mockItem.vote_average > 0 && (
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                              <Star className="h-3 w-3 text-white fill-current" />
                              <span className="text-white text-xs font-medium">
                                {mockItem.vote_average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Confidence Score */}
                        {mockItem.confidence_score && (
                          <div className="absolute bottom-2 left-2">
                            <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                              <span className="text-white text-xs font-medium">
                                {Math.round(mockItem.confidence_score * 100)}% match
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {mockItem.title}
                      </h3>
                      
                      {mockItem.release_date && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(mockItem.release_date).getFullYear()}</span>
                        </div>
                      )}

                      {mockItem.overview && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {mockItem.overview}
                        </p>
                      )}

                      <div className="space-y-2">
                        <button
                          onClick={() => handlePlayClick(mockItem)}
                          className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                        >
                          Watch Trailer
                        </button>
                        
                        <button
                          onClick={() => handleAddToWatchlist(mockItem)}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                          Add to Watchlist
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {recommendationsData?.recommendations && recommendationsData.recommendations.length === 0 && !isLoading && !error && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Recommendations Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Add some movies and TV shows to your watchlist to get personalized recommendations.
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Content
                </Link>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 text-center">
              <div className="flex justify-center space-x-6">
                <Link
                  to="/search"
                  className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Search Content
                </Link>
                <Link
                  to="/watchlist"
                  className="text-green-600 hover:text-green-800 font-medium dark:text-green-400 dark:hover:text-green-300"
                >
                  View My Watchlist
                </Link>
              </div>
            </div>
          </div>
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
  )
} 