import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getEpisodes, updateEpisode, bulkUpdateEpisodes, syncEpisodes } from 'wasp/client/operations'
import { Check, Play, Eye, EyeOff, RefreshCw, Calendar } from 'lucide-react'

interface Episode {
  id: string
  tmdbId: number
  seasonNumber: number
  episodeNumber: number
  title: string
  airDate?: Date | null
  isWatched: boolean
}

interface EpisodeManagerProps {
  watchItemId: string
  tvShowTitle: string
  onClose: () => void
}

export default function EpisodeManager({ watchItemId, tvShowTitle, onClose }: EpisodeManagerProps) {
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set())
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: episodesData, isLoading, error, refetch } = useQuery(getEpisodes, { watchItemId })
  const episodes: Episode[] = Array.isArray(episodesData) ? episodesData : []

  const handleEpisodeToggle = async (episodeId: string, currentWatched: boolean) => {
    setIsUpdating(true)
    try {
      await updateEpisode({ id: episodeId, isWatched: !currentWatched })
      refetch()
    } catch (error) {
      console.error('Failed to update episode:', error)
      alert('Failed to update episode. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkUpdate = async (isWatched: boolean) => {
    if (selectedEpisodes.size === 0) {
      alert('Please select episodes to update')
      return
    }

    setIsUpdating(true)
    try {
      await bulkUpdateEpisodes({
        watchItemId,
        episodeIds: Array.from(selectedEpisodes),
        isWatched
      })
      setSelectedEpisodes(new Set())
      refetch()
    } catch (error) {
      console.error('Failed to bulk update episodes:', error)
      alert('Failed to update episodes. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSyncEpisodes = async () => {
    setIsSyncing(true)
    try {
      await syncEpisodes({ watchItemId })
      refetch()
      alert('Episodes synced successfully!')
    } catch (error) {
      console.error('Failed to sync episodes:', error)
      alert('Failed to sync episodes. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSelectAll = () => {
    if (episodes && selectedEpisodes.size === episodes.length) {
      setSelectedEpisodes(new Set())
    } else {
      setSelectedEpisodes(new Set(episodes.map((ep: Episode) => ep.id)))
    }
  }

  const handleSelectEpisode = (episodeId: string) => {
    const newSelected = new Set(selectedEpisodes)
    if (newSelected.has(episodeId)) {
      newSelected.delete(episodeId)
    } else {
      newSelected.add(episodeId)
    }
    setSelectedEpisodes(newSelected)
  }

  const groupEpisodesBySeason = (episodes: Episode[]) => {
    const grouped: Record<number, Episode[]> = {}
    episodes.forEach(episode => {
      if (!grouped[episode.seasonNumber]) {
        grouped[episode.seasonNumber] = []
      }
      grouped[episode.seasonNumber].push(episode)
    })
    return grouped
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'TBA'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading episodes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading episodes: {error.message}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groupedEpisodes = groupEpisodesBySeason(episodes)
  const seasonNumbers = Object.keys(groupedEpisodes).map(Number).sort((a, b) => a - b)
  const watchedCount = episodes.filter((ep: Episode) => ep.isWatched).length
  const totalCount = episodes.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tvShowTitle}</h2>
            <p className="text-gray-600">
              Episode Progress: {watchedCount} / {totalCount} watched
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncEpisodes}
              disabled={isSyncing}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Episodes'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {episodes.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedEpisodes.size === episodes.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedEpisodes.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedEpisodes.size} episode{selectedEpisodes.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              {selectedEpisodes.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkUpdate(true)}
                    disabled={isUpdating}
                    className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Mark as Watched
                  </button>
                  <button
                    onClick={() => handleBulkUpdate(false)}
                    disabled={isUpdating}
                    className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Mark as Unwatched
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Episodes List */}
        <div className="flex-1 overflow-y-auto">
          {episodes.length > 0 ? (
            <div className="space-y-6">
              {seasonNumbers.map(seasonNumber => (
                <div key={seasonNumber} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Season {seasonNumber}
                    </h3>
                  </div>
                  <div className="divide-y">
                    {groupedEpisodes[seasonNumber].map(episode => (
                      <div
                        key={episode.id}
                        className={`flex items-center p-4 hover:bg-gray-50 ${
                          selectedEpisodes.has(episode.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEpisodes.has(episode.id)}
                          onChange={() => handleSelectEpisode(episode.id)}
                          className="mr-3 h-4 w-4 text-blue-600 rounded"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {episode.episodeNumber}.
                            </span>
                            <span className="text-gray-900">{episode.title}</span>
                            {episode.isWatched && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(episode.airDate)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEpisodeToggle(episode.id, episode.isWatched)}
                          disabled={isUpdating}
                          className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-colors ${
                            episode.isWatched
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50`}
                        >
                          {episode.isWatched ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Unwatch
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Watch
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No episodes found</h3>
              <p className="text-gray-500 mb-4">
                This TV show doesn't have any episodes synced yet.
              </p>
              <button
                onClick={handleSyncEpisodes}
                disabled={isSyncing}
                className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Episodes from TMDB'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 