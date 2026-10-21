import { HttpError } from 'wasp/server'
import type { SearchTMDB, GetTrendingContent } from 'wasp/server/operations'

const TMDB_API_KEY = '9b0eaa970893512ec6b66c8add587944'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  genre_ids: number[]
  media_type: 'movie'
  vote_average: number
  vote_count: number
  popularity: number
  original_title: string
  original_language: string
  backdrop_path: string | null
  adult: boolean
  video: boolean
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  first_air_date: string
  genre_ids: number[]
  media_type: 'tv'
  vote_average: number
  vote_count: number
  popularity: number
  original_name: string
  original_language: string
  backdrop_path: string | null
  adult: boolean
}

export interface TMDBResponse {
  page: number
  results: (TMDBMovie | TMDBTVShow)[]
  total_pages: number
  total_results: number
  [key: string]: any // Add index signature for SuperJSON compatibility
}

export const searchTMDB: SearchTMDB<{ query: string; page?: number }, TMDBResponse> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { query, page = 1 } = args

  if (!query || query.trim().length === 0) {
    throw new HttpError(400, 'Search query is required')
  }

  try {
    // Search for both movies and TV shows
    const searchUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new HttpError(500, 'Failed to fetch from TMDB API')
    }

    const data: TMDBResponse = await response.json()
    
    // Filter out non-movie/TV show results and transform the data
    const filteredResults = data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => {
        if (item.media_type === 'movie') {
          const movie = item as TMDBMovie
          return {
            ...movie,
            title: movie.title,
            release_date: movie.release_date,
            media_type: 'movie' as const
          }
        } else {
          const tvShow = item as TMDBTVShow
          return {
            ...tvShow,
            title: tvShow.name, // Normalize to 'title' for consistency
            release_date: tvShow.first_air_date,
            media_type: 'tv' as const
          }
        }
      })

    return {
      ...data,
      results: filteredResults
    }
  } catch (error) {
    console.error('TMDB API error:', error)
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(500, 'Failed to search TMDB')
  }
}

export const getTrendingContent: GetTrendingContent<void, TMDBResponse> = async (_args, context) => {
  try {
    // Fetch trending movies and TV shows for the week
    const trendingUrl = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&include_adult=false`
    
    const response = await fetch(trendingUrl)
    
    if (!response.ok) {
      throw new HttpError(500, 'Failed to fetch trending content from TMDB API')
    }

    const data: TMDBResponse = await response.json()
    
    // Transform the data to match our interface
    const transformedResults = data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => {
        if (item.media_type === 'movie') {
          const movie = item as TMDBMovie
          return {
            ...movie,
            title: movie.title,
            release_date: movie.release_date,
            media_type: 'movie' as const
          }
        } else {
          const tvShow = item as TMDBTVShow
          return {
            ...tvShow,
            title: tvShow.name, // Normalize to 'title' for consistency
            release_date: tvShow.first_air_date,
            media_type: 'tv' as const
          }
        }
      })

    return {
      ...data,
      results: transformedResults.slice(0, 20) // Limit to 20 items for carousel
    }
  } catch (error) {
    console.error('TMDB Trending API error:', error)
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(500, 'Failed to fetch trending content')
  }
} 