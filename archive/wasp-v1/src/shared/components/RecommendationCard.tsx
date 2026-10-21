import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Star, 
  Calendar, 
  Film, 
  Tv, 
  Heart, 
  Eye,
  Plus,
  ExternalLink
} from 'lucide-react'
import { addToWatchlist } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import StarRating from './StarRating'

interface RecommendationCardProps {
  item: {
    id: number
    title: string
    poster_path: string | null
    vote_average: number
    release_date: string
    overview: string
    media_type: 'movie' | 'tv'
  }
  explanation?: string
  showExplanation?: boolean
  onAddToWatchlist?: () => void
}

export default function RecommendationCard({
  item,
  explanation,
  showExplanation = false,
  onAddToWatchlist
}: RecommendationCardProps) {
  const { data: user } = useAuth()
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)
  const [showFullExplanation, setShowFullExplanation] = useState(false)

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return '/placeholder-poster.jpg'
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const handleAddToWatchlist = async () => {
    if (!user) {
      alert('Please log in to add items to your watchlist')
      return
    }

    setIsAddingToWatchlist(true)
    try {
      await addToWatchlist({
        tmdbId: item.id,
        mediaType: item.media_type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        title: item.title,
        posterPath: item.poster_path || undefined,
        overview: item.overview,
        genres: [], // Will be populated by the backend
        releaseDate: item.release_date
      })
      onAddToWatchlist?.()
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      alert('Failed to add to watchlist. Please try again.')
    } finally {
      setIsAddingToWatchlist(false)
    }
  }

  const truncatedExplanation = explanation && explanation.length > 120 
    ? explanation.substring(0, 120) + '...' 
    : explanation

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-white/30 dark:border-gray-700/50"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative group">
        <img
          src={getPosterUrl(item.poster_path)}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-poster.jpg'
          }}
        />
        
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

        {/* Rating Badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3 w-3 text-white fill-current" />
              <span className="text-white text-xs font-medium">
                {item.vote_average.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToWatchlist}
              disabled={isAddingToWatchlist}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white transition-colors"
              title="Add to Watchlist"
            >
              {isAddingToWatchlist ? (
                <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:line-clamp-none transition-all">
          {item.title}
        </h3>
        
        {item.release_date && (
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
            <Calendar className="h-3 w-3" />
            <span>{new Date(item.release_date).getFullYear()}</span>
          </div>
        )}

        {/* AI Explanation */}
        {showExplanation && explanation && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {showFullExplanation ? explanation : truncatedExplanation}
                </p>
                {explanation.length > 120 && (
                  <button
                    onClick={() => setShowFullExplanation(!showFullExplanation)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                  >
                    {showFullExplanation ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            to={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            <span>View Details</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <button
            onClick={handleAddToWatchlist}
            disabled={isAddingToWatchlist}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isAddingToWatchlist ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span>Add to Watchlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
} 