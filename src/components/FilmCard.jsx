import { Poster, Skeleton, StatusChip } from './ui'

/** Poster tile used for trending and search. `status` marks films already on your list. */
export default function FilmCard({ film, onSelect, selected, status, eager }) {
  const Tag = onSelect ? 'button' : 'div'
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      onClick={onSelect ? () => onSelect(film) : undefined}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      className="group relative block w-full self-start text-left outline-offset-[6px]"
    >
      <span className={`lock-on hud-corners block ${selected ? 'is-locked' : ''}`} style={{ '--corner': selected ? '#00f5ff' : undefined }}>
        <span
          className={`relative block overflow-hidden rounded-[4px] ring-1 transition duration-500 ease-out ${
            selected ? 'ring-neon' : 'ring-white/[0.08] group-hover:-translate-y-1 group-hover:ring-white/20'
          }`}
        >
          <Poster path={film.posterPath} title={film.title} eager={eager} className="w-full transition duration-700 ease-out group-hover:scale-[1.04]" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
          {status ? <StatusChip status={status} boxed className="absolute left-2 top-2" /> : null}
          {selected ? (
            <span className="absolute inset-x-2 bottom-2 rounded-[3px] bg-neon py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-void">Locked in</span>
          ) : null}
        </span>
      </span>
      <span className="mt-3 line-clamp-3 font-semibold leading-tight text-white">{film.title}</span>
      <span className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
        {film.releaseYear || '—'}
        {film.voteAverage ? (
          <>
            <span aria-hidden="true" className="h-1 w-1 bg-white/25" />
            <span>
              <span className="sr-only">TMDB rating </span>
              <span aria-hidden="true">TMDB </span>
              <span className="text-slate-300">{film.voteAverage.toFixed(1)}</span>
            </span>
          </>
        ) : null}
      </span>
    </Tag>
  )
}

export function FilmGridSkeleton({ count = 10, className = '' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading films">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}
