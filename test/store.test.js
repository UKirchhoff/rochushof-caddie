import { describe, it, expect } from 'vitest'
import { mergeState, toCSV, leererStand } from '../src/state/store.js'

const runde = (id, stableford, diff) => ({
  id,
  datum: '2026-07-24T10:00:00.000Z',
  courseId: 'rochushof',
  teeId: 'gelb',
  holes: 18,
  handicapIndex: 24.5,
  ch: 26,
  vorgaben: [],
  bruttos: [],
  stablefordSumme: stableford,
  bruttoSumme: 98,
  nettoSumme: 72,
  differential: diff,
})

describe('mergeState (Import)', () => {
  it('replace ersetzt den kompletten Stand', () => {
    const current = { ...leererStand(), rounds: [runde('a', 30, 20)] }
    const incoming = { ...leererStand(), rounds: [runde('b', 36, 15)] }
    const result = mergeState(current, incoming, 'replace')
    expect(result.rounds.map((r) => r.id)).toEqual(['b'])
  })

  it('merge vereinigt Runden nach id (keine Duplikate)', () => {
    const current = { ...leererStand(), rounds: [runde('a', 30, 20), runde('b', 32, 18)] }
    const incoming = { ...leererStand(), rounds: [runde('b', 99, 18), runde('c', 40, 10)] }
    const result = mergeState(current, incoming, 'merge')
    const ids = result.rounds.map((r) => r.id).sort()
    expect(ids).toEqual(['a', 'b', 'c'])
    // eingehende Version von 'b' gewinnt
    expect(result.rounds.find((r) => r.id === 'b').stablefordSumme).toBe(99)
  })

  it('merge behaelt die laufende Runde des aktuellen Stands', () => {
    const current = { ...leererStand(), activeRound: runde('live', 0, null) }
    const incoming = { ...leererStand(), activeRound: null }
    const result = mergeState(current, incoming, 'merge')
    expect(result.activeRound.id).toBe('live')
  })
})

describe('toCSV', () => {
  it('erzeugt Kopfzeile und eine Zeile je Runde, Komma-Dezimal, Semikolon-Trenner', () => {
    const csv = toCSV([runde('a', 36, 24.6)])
    const zeilen = csv.trim().split('\n')
    expect(zeilen).toHaveLength(2)
    expect(zeilen[0]).toContain('Datum')
    expect(zeilen[0]).toContain('Stableford')
    // Differential mit Komma
    expect(zeilen[1]).toContain('24,6')
    expect(zeilen[1].split(';').length).toBe(zeilen[0].split(';').length)
  })

  it('schreibt "wartend" fuer Runden ohne Differential', () => {
    const csv = toCSV([runde('a', 18, null)])
    expect(csv).toContain('wartend')
  })
})
