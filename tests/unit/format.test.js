import { describe, expect, it } from 'vitest'
import { pad2, ratingWord, splitPercents, timeAgo } from '../../src/lib/format.js'

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
