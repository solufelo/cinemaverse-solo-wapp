// Shared between the React client and the API so both sides agree on the vocabulary.

export const WATCH_STATUSES = ['watching', 'completed', 'planned', 'dropped'] as const
export type WatchStatus = (typeof WATCH_STATUSES)[number]

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  planned: 'Queued',
  dropped: 'Dropped',
}

// Past-tense verbs for feed lines: "@nova completed Dune: Part Two".
export const STATUS_VERBS: Record<WatchStatus, string> = {
  watching: 'is watching',
  completed: 'completed',
  planned: 'queued',
  dropped: 'dropped',
}

export const NOTE_MAX = 280
export const BIO_MAX = 160
export const DISPLAY_NAME_MAX = 40

// TMDB movie genre ids -> names (stable list from /genre/movie/list), so search
// results, which only carry genre_ids, can be logged with readable genres.
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}
