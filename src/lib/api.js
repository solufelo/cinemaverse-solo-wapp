export class ApiError extends Error {
  constructor(status, message, code, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields || {}
  }
}

/** JSON fetch against our own /api. Mutations always send a JSON body (the server rejects anything else). */
export async function api(path, { method = 'GET', body, signal } = {}) {
  const hasBody = method !== 'GET' && method !== 'DELETE'
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: hasBody ? { 'content-type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body ?? {}) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", 'network')
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.message || `Request failed (${res.status}).`, e?.code, e?.details?.fields)
  }
  return data
}

let health = null
/** /api/health, fetched once per page load and shared (layout notices, TMDB availability). */
export function getHealth() {
  health ??= api('/health').catch((err) => {
    health = null
    throw err
  })
  return health
}
