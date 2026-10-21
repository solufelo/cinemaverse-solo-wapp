import { handler } from '../../server/app.ts'

// Netlify Functions v2: one function serves the whole JSON API under /api/*.
export default async (req: Request, context: { ip?: string }) => handler(req, { clientIp: context?.ip })

export const config = { path: '/api/*' }
