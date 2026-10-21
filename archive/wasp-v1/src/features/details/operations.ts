import { HttpError } from 'wasp/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BEARER = process.env.TMDB_BEARER_TOKEN;

async function tmdbFetch(url: string) {
  const headers: Record<string, string> = {};
  if (TMDB_BEARER) {
    headers['Authorization'] = `Bearer ${TMDB_BEARER}`;
  }
  const fullUrl = TMDB_BEARER ? url : `${url}${url.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  const res = await fetch(fullUrl, { headers });
  if (!res.ok) throw new HttpError(res.status, 'Failed to fetch from TMDB');
  return res.json();
}

export const getMovieDetails = async ({ id }: { id: number }) => {
  return tmdbFetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=videos,credits,images,recommendations,reviews`);
};

export const getTVDetails = async ({ id }: { id: number }) => {
  return tmdbFetch(`https://api.themoviedb.org/3/tv/${id}?append_to_response=videos,credits,images,recommendations,reviews`);
}; 