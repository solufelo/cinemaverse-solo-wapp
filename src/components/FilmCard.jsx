import { Star } from 'lucide-react'
import { Poster, Skeleton, StatusChip } from './ui'

/** Poster tile used for trending and search. `status` marks films already on your list. */
export default function FilmCard({ film, onSelect, selected, status, eager }) {
  const Tag = onSelect ? 'button' : 'div'
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      onClick={onSelect ? () => onSelect(film) : undefined}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      className={`group relative block w-full overflow-hidden rounded-xl border text-left transition duration-300 ${
        selected
          ? 'border-neon shadow-neon'
          : 'border-white/[0.08] hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_18px_40px_-20px_rgba(0,245,255,0.45)]'
      }`}
    >
      <div className="overflow-hidden">
        <Poster path={film.posterPath} title={film.title} eager={eager} className="w-full transition duration-500 group-hover:scale-[1.04]" />
      </div>
      {status ? <StatusChip status={status} className="absolute left-2 top-2 bg-void/80 backdrop-blur" /> : null}
      <div className="bg-panel/95 p-3">
        <h3 className="truncate font-semibold text-white">{film.title}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          {film.releaseYear || '—'}
          {film.voteAverage ? (
            <>
              <span aria-hidden="true">·</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="sr-only">TMDB rating</span>
              {film.voteAverage.toFixed(1)}
            </>
          ) : null}
        </p>
      </div>
    </Tag>
  )
}

export function FilmGridSkeleton({ count = 10, className = '' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading films">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/[0.06]">
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <div className="space-y-2 bg-panel/95 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
