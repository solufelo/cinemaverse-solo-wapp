import { describe, expect, it } from 'vitest'
import { groupByDay, metaLine, pad2, pickTakes, ratingWord, splitPercents, timeAgo } from '../../src/lib/format.js'

describe('pad2', () => {
  it('pads single digits for HUD numerals', () => {
    expect(pad2(3)).toBe('03')
    expect(pad2(12)).toBe('12')
  })
})

describe('ratingWord', () => {
  it('names every band of the 1-10 scale', () => {
    expect(ratingWord(null)).toBe('Not rated')
    expect([1, 2].map(ratingWord)).toEqual(['Skip it', 'Skip it'])
    expect([3, 4].map(ratingWord)).toEqual(['Meh', 'Meh'])
    expect([5, 6].map(ratingWord)).toEqual(['Decent', 'Decent'])
    expect([7, 8].map(ratingWord)).toEqual(['Great', 'Great'])
    expect(ratingWord(9)).toBe('Superb')
    expect(ratingWord(10)).toBe('Masterpiece')
  })
})

describe('splitPercents', () => {
  it('always sums to exactly 100 and skips empty statuses', () => {
    const p = splitPercents({ watching: 1, completed: 5, planned: 1, dropped: 0 })
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBe(100)
    expect(p).not.toHaveProperty('dropped')
    expect(p.completed).toBeGreaterThan(p.watching)
  })

  it('gives thirds a 34/33/33 split rather than 99%', () => {
    const p = splitPercents({ a: 1, b: 1, c: 1 })
    expect(Object.values(p).sort()).toEqual([33, 33, 34])
  })

  it('returns nothing for an empty log', () => {
    expect(splitPercents({ watching: 0, completed: 0 })).toEqual({})
  })
})

describe('timeAgo', () => {
  const now = Date.parse('2026-10-20T12:00:00Z')
  it('reads like a feed timestamp', () => {
    expect(timeAgo('2026-10-20T11:59:50Z', now)).toBe('just now')
    expect(timeAgo('2026-10-20T11:40:00Z', now)).toBe('20 min. ago')
    expect(timeAgo('2026-10-20T09:00:00Z', now)).toBe('3 hr. ago')
  })
})

describe('groupByDay', () => {
  // Local-time dates, so the test holds in any timezone.
  const now = new Date(2026, 9, 21, 15, 0).getTime() // Wednesday 21 Oct, 15:00
  const at = (d, h) => ({ id: `${d}-${h}`, createdAt: new Date(2026, 9, d, h).toISOString() })

  it('labels days the way a feed reads and keeps newest-first order', () => {
    const groups = groupByDay([at(21, 14), at(21, 1), at(20, 23), at(18, 9), at(13, 9), at(2, 9)], now)
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Sunday', 'Oct 13', 'Oct 2'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['21-14', '21-1'])
  })

  it('treats a clock-skewed future post as today and handles an empty feed', () => {
    expect(groupByDay([at(22, 1)], now)[0].label).toBe('Today')
    expect(groupByDay([], now)).toEqual([])
  })
})

describe('metaLine', () => {
  it('drops trailing genres instead of truncating the line', () => {
    expect(metaLine(2021, ['Science Fiction', 'Adventure'])).toBe('2021 · Sci-Fi · Adventure')
    expect(metaLine(2023, ['Animation', 'Adventure'], { max: 20 })).toBe('2023 · Animation')
    expect(metaLine(2019, ['War', 'Drama', 'History'])).toBe('2019 · War · Drama')
    expect(metaLine(2019, ['War', 'Drama'], { limit: 1 })).toBe('2019 · War')
  })

  it('always keeps the year and first genre, and skips missing parts', () => {
    expect(metaLine(1968, ['Science Fiction', 'Mystery'], { max: 5 })).toBe('1968 · Sci-Fi')
    expect(metaLine(null, ['Drama'])).toBe('Drama')
    expect(metaLine(2001, [])).toBe('2001')
  })
})

describe('pickTakes', () => {
  const post = (id, film, status, note, hour) => ({ id, film: { tmdbId: film }, status, note, createdAt: `2026-10-20T${String(hour).padStart(2, '0')}:00:00Z` })

  it('prefers takes with different statuses, one per film, newest first', () => {
    const items = [
      post('a', 1, 'completed', 'great', 12),
      post('b', 2, 'completed', 'also great', 11),
      post('c', 3, 'watching', '', 10),
      post('d', 4, 'dropped', 'not for me', 9),
      post('e', 1, 'planned', 'again', 8),
      post('f', 5, 'planned', 'next week', 7),
    ]
    expect(pickTakes(items).map((i) => i.id)).toEqual(['a', 'd', 'f'])
  })

  it('falls back to repeated statuses, then bare logs', () => {
    const items = [post('a', 1, 'completed', 'x', 12), post('b', 2, 'completed', 'y', 11), post('c', 3, 'watching', '', 10)]
    expect(pickTakes(items).map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(pickTakes([])).toEqual([])
  })
})
