/**
 * Scroll reveal for anything marked [data-reveal]. Sets [data-in] (not a class, so React
 * re-renders never strip it) the first time an element enters the viewport. Watches the DOM
 * so content that loads later is picked up too. Under reduced motion the CSS shows everything
 * immediately; we still mark elements so the state is consistent.
 */
export function startReveal(root) {
  if (!root) return () => {}
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const canObserve = typeof IntersectionObserver !== 'undefined' && !reduced

  const io = canObserve
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
      )
    : null

  // Per-instance bookkeeping, not a DOM marker: StrictMode mounts, cleans up and mounts again.
  const watched = new WeakSet()
  let frame = 0
  const scan = () => {
    frame = 0
    for (const el of root.querySelectorAll('[data-reveal]:not([data-in])')) {
      if (watched.has(el)) continue
      watched.add(el)
      if (io) {
        io.observe(el)
      } else {
        el.setAttribute('data-in', '')
      }
    }
  }
  scan()
  const mo = new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(scan)
  })
  mo.observe(root, { childList: true, subtree: true })

  return () => {
    io?.disconnect()
    mo.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}
