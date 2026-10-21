const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' })

export function timeAgo(iso, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 45) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function memberSince(iso) {
  return new Date(iso).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
