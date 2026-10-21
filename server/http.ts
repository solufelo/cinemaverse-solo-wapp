import type { ZodType } from 'zod'

export class HttpError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const SECURITY_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

export function json(data: unknown, init: { status?: number; headers?: HeadersInit } = {}) {
  const headers = new Headers(SECURITY_HEADERS)
  if (init.headers) new Headers(init.headers).forEach((v, k) => headers.append(k, v))
  return new Response(JSON.stringify(data), { status: init.status ?? 200, headers })
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return json(
      { error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } },
      { status: err.status },
    )
  }
  console.error('[api] unhandled error', err)
  return json({ error: { code: 'internal', message: 'Something went wrong on our side. Try again.' } }, { status: 500 })
}

const MAX_BODY_BYTES = 16 * 1024

/** Parse and validate a JSON body. Rejects non-JSON content types (blocks form-post CSRF). */
export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const type = req.headers.get('content-type') || ''
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Send the request body as JSON.')
  }
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large', 'Request body is too large.')
  let raw: unknown
  try {
    raw = text ? JSON.parse(text) : {}
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body is not valid JSON.')
  }
  return validate(schema, raw)
}

export function validate<T>(schema: ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_'
      fields[key] ??= issue.message
    }
    const first = Object.entries(fields)[0]
    const message = first ? (first[0] === '_' ? first[1] : `${first[0]}: ${first[1]}`) : 'Invalid input.'
    throw new HttpError(400, 'validation_failed', message, { fields })
  }
  return parsed.data
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k) {
      try {
        out[k] = decodeURIComponent(v)
      } catch {
        out[k] = v
      }
    }
  }
  return out
}

export function serializeCookie(
  name: string,
  value: string,
  opts: { maxAge: number; secure: boolean },
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${opts.maxAge}`]
  if (opts.secure) parts.push('Secure')
  return parts.join('; ')
}
