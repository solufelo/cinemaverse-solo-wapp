import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { searchTMDB, getTrendingContent } from 'wasp/client/operations'
import { addToWatchlist } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'react-router-dom'
import { Play, Star, Calendar, Film, Tv, Search, TrendingUp, Filter, X } from 'lucide-react'
import TrailerModal from '../../shared/components/TrailerModal'
import Header2 from '../../components/mvpblocks/header'

interface SearchResult {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  media_type: 'movie' | 'tv'
  vote_average?: number
}

// Helper function to normalize TMDB results
const normalizeSearchResult = (item: any): SearchResult => {
  return {
    id: item.id,
    title: item.media_type === 'movie' ? item.title : item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date,
    media_type: item.media_type,
    vote_average: item.vote_average
  }
}

// Available genres for filtering
const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 
  'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

// Available years for filtering
const YEARS = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

export default function SearchPage() {
  const { data: user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<{ id: number; title: string; mediaType: 'movie' | 'tv' } | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced search filters
  const [filters, setFilters] = useState({
    mediaType: 'all' as 'all' | 'movie' | 'tv',
    year: 'all' as string,
    genre: 'all' as string,
    minRating: 0 as number,
    sortBy: 'relevance' as 'relevance' | 'rating' | 'date' | 'title'
  })

  // Fetch trending content for initial display
  const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useQuery(getTrendingContent)

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery(searchTMDB, 
    currentQuery ? { query: currentQuery, page } : undefined
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim())
      setPage(1)
    }
  }

  const handlePlayClick = (item: SearchResult) => {
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

  const handleAddToWatchlist = async (item: SearchResult) => {
    try {
      await addToWatchlist({
        tmdbId: item.id,
        mediaType: item.media_type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        title: item.title,
        posterPath: item.poster_path || undefined,
        overview: item.overview || '',
        genres: [], // We'll need to fetch genres separately
        releaseDate: item.release_date || undefined
      })
      alert(`${item.title} added to your watchlist!`)
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      alert('Failed to add to watchlist. Please try again.')
    }
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return '/placeholder-poster.jpg'
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  // Show trending content when no search is performed
  const showTrendingContent = !currentQuery && !searchLoading

  // Filter search results based on advanced filters
  const filteredResults = searchResults?.results?.filter((item: any) => {
    const normalizedItem = normalizeSearchResult(item)
    
    // Media type filter
    if (filters.mediaType !== 'all' && normalizedItem.media_type !== filters.mediaType) {
      return false
    }
    
    // Year filter
    if (filters.year !== 'all' && normalizedItem.release_date) {
      const itemYear = new Date(normalizedItem.release_date).getFullYear().toString()
      if (itemYear !== filters.year) {
        return false
      }
    }
    
    // Rating filter
    if (filters.minRating > 0 && (!normalizedItem.vote_average || normalizedItem.vote_average < filters.minRating)) {
      return false
    }
    
    return true
  }) || []

  return (
    <>
      <div className="relative min-h-screen">
        {/* Stylized Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,_#3b82f6_1px,_transparent_1px),_linear-gradient(-45deg,_#8b5cf6_1px,_transparent_1px)] bg-[size:30px_30px] opacity-20 dark:opacity-30"></div>
        </div>
        <div className="relative z-10">
          <Header2 />
        
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 whitespace-nowrap">
                Search Movies & TV Shows
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Discover and add content to your watchlist</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for movies or TV shows..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mb-6 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Media Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Media Type
                    </label>
                    <select
                      value={filters.mediaType}
                      onChange={(e) => setFilters({...filters, mediaType: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="movie">Movies</option>
                      <option value="tv">TV Shows</option>
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year
                    </label>
                    <select
                      value={filters.year}
                      onChange={(e) => setFilters({...filters, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Years</option>
                      {YEARS.map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Genre
                    </label>
                    <select
                      value={filters.genre}
                      onChange={(e) => setFilters({...filters, genre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Genres</option>
                      {GENRES.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Rating
                    </label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={5}>5+ Stars</option>
                      <option value={6}>6+ Stars</option>
                      <option value={7}>7+ Stars</option>
                      <option value={8}>8+ Stars</option>
                      <option value={9}>9+ Stars</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="rating">Rating</option>
                      <option value="date">Release Date</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mb-6 flex justify-center">
              <div className="flex space-x-4">
                <Link
                  to="/watchlist"
                  className="text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View My Watchlist
                </Link>
                <Link
                  to="/recommendations"
                  className="text-green-600 hover:text-green-800 font-medium dark:text-green-400 dark:hover:text-green-300"
                >
                  AI Recommendations
                </Link>
              </div>
            </div>

            {/* Trending Content Section - Show when no search is performed */}
            {showTrendingContent && (
              <div className="mb-12">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Trending Now
                  </h2>
                </div>
                
                {trendingLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trending content...</p>
                  </div>
                ) : trendingError ? (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-200">
                        We're having trouble loading trending content right now. Try searching for something specific!
                      </p>
                    </div>
                  </div>
                ) : trendingData?.results ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {trendingData.results.slice(0, 10).map((item: any) => {
                      const normalizedItem = normalizeSearchResult(item)
                      return (
                        <div
                          key={`${item.media_type}-${item.id}`}
                          className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-gray-700/50"
                        >
                          {/* Poster - Clickable to go to details */}
                          <Link to={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}>
                            <div className="aspect-[2/3] relative overflow-hidden">
                              <img
                                src={getPosterUrl(item.poster_path)}
                                alt={normalizedItem.title}
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
                                    handlePlayClick(normalizedItem);
                                  }}
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
                              {normalizedItem.vote_average && normalizedItem.vote_average > 0 && (
                                <div className="absolute top-2 right-2">
                                  <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                                    <Star className="h-3 w-3 text-white fill-current" />
                                    <span className="text-white text-xs font-medium">
                                      {normalizedItem.vote_average.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {normalizedItem.title}
                            </h3>
                            
                            {normalizedItem.release_date && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(normalizedItem.release_date).getFullYear()}</span>
                              </div>
                            )}

                            {normalizedItem.overview && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                                {normalizedItem.overview}
                              </p>
                            )}

                            <div className="space-y-2">
                              <button
                                onClick={() => handlePlayClick(normalizedItem)}
                                className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                              >
                                Watch Trailer
                              </button>
                              
                              <button
                                onClick={() => handleAddToWatchlist(normalizedItem)}
                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                              >
                                Add to Watchlist
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {/* Search Results */}
            {searchError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-200">
                  We couldn't find any results for "{currentQuery}". Try searching for something else or check your spelling.
                </p>
              </div>
            )}

            {searchLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Searching for "{currentQuery}"...</p>
              </div>
            )}

            {searchResults && (
              <div>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Found {filteredResults.length} results for "{currentQuery}"
                  </p>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredResults.map((item) => {
                    const normalizedItem = normalizeSearchResult(item)
                    return (
                      <div
                        key={`${item.media_type}-${item.id}`}
                        className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-gray-700/50"
                      >
                        {/* Poster - Clickable to go to details */}
                        <Link to={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}>
                          <div className="aspect-[2/3] relative overflow-hidden">
                            <img
                              src={getPosterUrl(item.poster_path)}
                              alt={normalizedItem.title}
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
                                  handlePlayClick(normalizedItem);
                                }}
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
                            {normalizedItem.vote_average && normalizedItem.vote_average > 0 && (
                              <div className="absolute top-2 right-2">
                                <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                                  <Star className="h-3 w-3 text-white fill-current" />
                                  <span className="text-white text-xs font-medium">
                                    {normalizedItem.vote_average.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {normalizedItem.title}
                          </h3>
                          
                          {normalizedItem.release_date && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(normalizedItem.release_date).getFullYear()}</span>
                            </div>
                          )}

                          {normalizedItem.overview && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                              {normalizedItem.overview}
                            </p>
                          )}

                          <div className="space-y-2">
                            <button
                              onClick={() => handlePlayClick(normalizedItem)}
                              className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
                            >
                              Watch Trailer
                            </button>
                            
                            <button
                              onClick={() => handleAddToWatchlist(normalizedItem)}
                              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                              Add to Watchlist
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {searchResults.total_pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      Page {page} of {searchResults.total_pages}
                    </span>
                    
                    <button
                      onClick={() => setPage(Math.min(searchResults.total_pages, page + 1))}
                      disabled={page === searchResults.total_pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!searchLoading && !searchError && !searchResults && currentQuery && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found for "{currentQuery}"
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try searching for something else or browse our trending content above.
                </p>
                <button
                  onClick={() => setCurrentQuery('')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Trending
                </button>
              </div>
            )}
          </div>
        </main>
        </div>
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