import React, { useState, useMemo } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getWatchlist, updateWatchItem, removeFromWatchlist } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'react-router-dom'
import { WatchStatus } from '@prisma/client'
import EpisodeManager from './EpisodeManager'
import StarRating from '../../shared/components/StarRating'
import WatchlistFilters from '../../shared/components/WatchlistFilters'
import Header2 from '../../components/mvpblocks/header'

interface WatchlistItem {
  id: string
  tmdbId: number
  mediaType: 'MOVIE' | 'TV_SHOW'
  title: string
  posterPath?: string | null
  overview?: string | null
  genres: string[]
  releaseDate?: Date | null
  status: WatchStatus
  rating?: number | null
  episodes: any[]
}

export default function WatchlistPage() {
  const { data: user } = useAuth()
  const [episodeManagerOpen, setEpisodeManagerOpen] = useState(false)
  const [selectedTVShow, setSelectedTVShow] = useState<WatchlistItem | null>(null)
  
  // Enhanced filter state
  const [filters, setFilters] = useState({
    status: 'ALL' as WatchStatus | 'ALL',
    mediaType: 'ALL' as 'ALL' | 'MOVIE' | 'TV_SHOW',
    genre: 'all',
    minRating: 0,
    sortBy: 'dateAdded' as 'dateAdded' | 'releaseDate' | 'title' | 'rating',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const { data: watchlist, isLoading, error, refetch } = useQuery(getWatchlist)

  // Get available genres from watchlist
  const availableGenres = useMemo(() => {
    if (!watchlist) return []
    const genres = new Set<string>()
    watchlist.forEach(item => {
      item.genres.forEach(genre => genres.add(genre))
    })
    return Array.from(genres).sort()
  }, [watchlist])

  // Enhanced filtering and sorting logic
  const filteredWatchlist = useMemo(() => {
    if (!watchlist) return []

    let filtered = watchlist.filter(item => {
      // Status filter
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false
      }

      // Media type filter
      if (filters.mediaType !== 'ALL' && item.mediaType !== filters.mediaType) {
        return false
      }

      // Genre filter
      if (filters.genre !== 'all' && !item.genres.includes(filters.genre)) {
        return false
      }

      // Rating filter
      if (filters.minRating > 0 && (!item.rating || item.rating < filters.minRating)) {
        return false
      }

      return true
    })

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'dateAdded':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'releaseDate':
          aValue = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
          bValue = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        default:
          return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [watchlist, filters])

  const handleStatusChange = async (itemId: string, newStatus: WatchStatus) => {
    try {
      await updateWatchItem({ id: itemId, status: newStatus })
      refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const handleRatingChange = async (itemId: string, newRating: number) => {
    try {
      await updateWatchItem({ id: itemId, rating: newRating })
      refetch()
    } catch (error) {
      console.error('Failed to update rating:', error)
      alert('Failed to update rating. Please try again.')
    }
  }

  const handleRemoveItem = async (itemId: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}" from your watchlist?`)) {
      try {
        await removeFromWatchlist({ id: itemId })
        refetch()
      } catch (error) {
        console.error('Failed to remove item:', error)
        alert('Failed to remove item. Please try again.')
      }
    }
  }

  const handleOpenEpisodeManager = (item: WatchlistItem) => {
    if (item.mediaType === 'TV_SHOW') {
      setSelectedTVShow(item)
      setEpisodeManagerOpen(true)
    }
  }

  const handleCloseEpisodeManager = () => {
    setEpisodeManagerOpen(false)
    setSelectedTVShow(null)
  }

  const getPosterUrl = (posterPath: string | null | undefined) => {
    if (!posterPath) return '/placeholder-poster.jpg'
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getStatusColor = (status: WatchStatus) => {
    switch (status) {
      case 'WATCHING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'DROPPED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'PLANNED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your watchlist...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
        <Header2 />
        <main className="pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-20">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-yellow-600 dark:text-yellow-400 text-4xl mb-4">📺</div>
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Unable to Load Watchlist
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  We're having trouble loading your watchlist right now. Please try again later.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-900">
      <Header2 />
      <main className="pt-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Watchlist</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your favorite movies and TV shows</p>
          </div>

          {/* Filters */}
          <WatchlistFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableGenres={availableGenres}
            totalItems={watchlist?.length || 0}
            filteredCount={filteredWatchlist.length}
          />

          {/* Watchlist Grid */}
          {filteredWatchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
              {filteredWatchlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative">
                    <img
                      src={getPosterUrl(item.posterPath)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-poster.jpg'
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.mediaType === 'MOVIE' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {item.mediaType === 'MOVIE' ? 'Movie' : 'TV Show'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    {item.releaseDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(item.releaseDate).getFullYear()}
                      </p>
                    )}

                    {item.overview && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {item.overview}
                      </p>
                    )}

                    {/* Status */}
                    <div className="mb-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as WatchStatus)}
                        className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="PLANNED">Planned</option>
                        <option value="WATCHING">Watching</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DROPPED">Dropped</option>
                      </select>
                    </div>

                    {/* Rating */}
                    <div className="mb-3">
                      <StarRating
                        rating={item.rating || 0}
                        onRatingChange={(rating) => handleRatingChange(item.id, rating)}
                        size="sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {item.mediaType === 'TV_SHOW' && (
                        <button
                          onClick={() => handleOpenEpisodeManager(item)}
                          className="w-full px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Manage Episodes
                        </button>
                      )}
                      
                      <Link
                        to={item.mediaType === 'MOVIE' ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`}
                        className="block w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id, item.title)}
                        className="w-full px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📺</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Your watchlist is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start adding movies and TV shows to your watchlist to track your viewing progress.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Start Searching
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Episode Manager Modal */}
      {episodeManagerOpen && selectedTVShow && (
        <EpisodeManager
          watchItemId={selectedTVShow.id}
          tvShowTitle={selectedTVShow.title}
          onClose={handleCloseEpisodeManager}
        />
      )}
    </div>
  )
} 