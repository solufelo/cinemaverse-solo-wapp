import React from 'react'
import { motion } from 'framer-motion'
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  Star, 
  Film, 
  Tv,
  X,
  RefreshCw
} from 'lucide-react'
import { WatchStatus } from '@prisma/client'

interface FilterState {
  status: WatchStatus | 'ALL'
  mediaType: 'ALL' | 'MOVIE' | 'TV_SHOW'
  genre: string
  minRating: number
  sortBy: 'dateAdded' | 'releaseDate' | 'title' | 'rating'
  sortOrder: 'asc' | 'desc'
}

interface WatchlistFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableGenres: string[]
  totalItems: number
  filteredCount: number
}

export default function WatchlistFilters({
  filters,
  onFiltersChange,
  availableGenres,
  totalItems,
  filteredCount
}: WatchlistFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      status: 'ALL',
      mediaType: 'ALL',
      genre: 'all',
      minRating: 0,
      sortBy: 'dateAdded',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.status !== 'ALL' || 
    filters.mediaType !== 'ALL' || 
    filters.genre !== 'all' || 
    filters.minRating > 0

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 dark:border-gray-700/50 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters & Sorting</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {filteredCount} of {totalItems}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            <span>{isExpanded ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>
      </div>

      {/* Basic Filters (Always Visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="WATCHING">Watching</option>
            <option value="COMPLETED">Completed</option>
            <option value="DROPPED">Dropped</option>
          </select>
        </div>

        {/* Media Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filters.mediaType}
            onChange={(e) => updateFilter('mediaType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="MOVIE">Movies</option>
            <option value="TV_SHOW">TV Shows</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="dateAdded">Date Added</option>
            <option value="releaseDate">Release Date</option>
            <option value="title">Title</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => updateFilter('sortOrder', 'asc')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                filters.sortOrder === 'asc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SortAsc className="h-4 w-4 inline mr-1" />
              Asc
            </button>
            <button
              onClick={() => updateFilter('sortOrder', 'desc')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                filters.sortOrder === 'desc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SortDesc className="h-4 w-4 inline mr-1" />
              Desc
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Genre Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <select
              value={filters.genre}
              onChange={(e) => updateFilter('genre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Genres</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="10"
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-600 min-w-[2rem] text-center">
                {filters.minRating}
              </span>
            </div>
          </div>

          {/* Quick Rating Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Filters</label>
            <div className="flex flex-wrap gap-1">
              {[4, 7, 8, 9].map(rating => (
                <button
                  key={rating}
                  onClick={() => updateFilter('minRating', rating)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    filters.minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating}+ <Star className="h-3 w-3 inline" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'ALL' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Status: {filters.status}
              </span>
            )}
            {filters.mediaType !== 'ALL' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Type: {filters.mediaType}
              </span>
            )}
            {filters.genre !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Genre: {filters.genre}
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Rating: {filters.minRating}+
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 