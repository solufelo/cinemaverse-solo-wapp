import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

/** GET a path from the API with loading / error / reload, cancelling stale requests. */
export function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(enabled && path) })
  const ctrl = useRef(null)

  const load = useCallback(async () => {
    if (!enabled || !path) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api(path, { signal: c.signal })
      if (!c.signal.aborted) setState({ data, error: null, loading: false })
    } catch (error) {
      if (error.name !== 'AbortError') setState((s) => ({ ...s, error, loading: false }))
    }
  }, [path, enabled])

  useEffect(() => {
    load()
    return () => ctrl.current?.abort()
  }, [load])

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), [])
  return { ...state, reload: load, setData }
}
