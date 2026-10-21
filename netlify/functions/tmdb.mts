import { handleTmdb } from '../../server/tmdb.ts'

// Same URL as before (/.netlify/functions/tmdb?path=...), now restricted to the read-only endpoints the app uses.
export default async (req: Request) => handleTmdb(req)
