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

/**
 * Newest-first feed items -> [{ key, label, items }] by local calendar day:
 * "Today", "Yesterday", a weekday within the week, then "Oct 3".
 */
export function groupByDay(items, now = Date.now()) {
  const startOf = (t) => new Date(t).setHours(0, 0, 0, 0)
  const today = startOf(now)
  const groups = []
  for (const item of items) {
    const day = startOf(item.createdAt)
    const last = groups[groups.length - 1]
    if (last?.key === day) {
      last.items.push(item)
      continue
    }
    // Math.round, not floor: a day across a DST change is 23 or 25 hours.
    const ago = Math.round((today - day) / 86400000)
    const label =
      ago <= 0
        ? 'Today'
        : ago === 1
          ? 'Yesterday'
          : ago < 7
            ? new Date(day).toLocaleDateString('en', { weekday: 'long' })
            : new Date(day).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    groups.push({ key: day, label, items: [item] })
  }
  return groups
}

/** 3 -> "03": HUD-style index numerals. */
export const pad2 = (n) => String(n).padStart(2, '0')

/** A word for a 1-10 rating, shown next to the rating readout. */
export function ratingWord(n) {
  if (!n) return 'Not rated'
  if (n <= 2) return 'Skip it'
  if (n <= 4) return 'Meh'
  if (n <= 6) return 'Decent'
  if (n <= 8) return 'Great'
  if (n === 9) return 'Superb'
  return 'Masterpiece'
}

/**
 * Status counts -> percentage widths that always add up to exactly 100
 * (largest-remainder rounding), so the split bar never shows a hairline gap.
 */
export function splitPercents(counts) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0)
  const total = entries.reduce((sum, [, n]) => sum + n, 0)
  if (!total) return {}
  const raw = entries.map(([k, n]) => [k, (n / total) * 100])
  const out = Object.fromEntries(raw.map(([k, v]) => [k, Math.floor(v)]))
  let left = 100 - Object.values(out).reduce((a, b) => a + b, 0)
  for (const [k] of [...raw].sort((a, b) => (b[1] % 1) - (a[1] % 1))) {
    if (left <= 0) break
    out[k] += 1
    left -= 1
  }
  return out
}
