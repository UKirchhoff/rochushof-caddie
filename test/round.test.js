import { describe, it, expect } from 'vitest'
import { neueRunde, rundeAuswertung } from '../src/core/round.js'
import { getCourse, getTee, getHoles } from '../src/data/course.js'

describe('neueRunde', () => {
  it('erzeugt eine 18-Loch-Runde mit CH und Vorgabeverteilung', () => {
    const r = neueRunde({
      id: 'r1',
      datum: '2026-07-24T10:00:00.000Z',
      courseId: 'rochushof',
      teeId: 'gelb',
      holes: 18,
      handicapIndex: 24.5,
    })
    expect(r.ch).toBe(26)
    expect(r.vorgaben.reduce((a, b) => a + b, 0)).toBe(26)
    expect(r.bruttos).toHaveLength(18)
    expect(r.bruttos.every((b) => b === null)).toBe(true)
  })

  it('erzeugt eine 9-Loch-Runde mit 9 Loechern', () => {
    const r = neueRunde({
      id: 'r2',
      datum: '2026-07-24T10:00:00.000Z',
      courseId: 'rochushof',
      teeId: 'gelb',
      holes: 9,
      handicapIndex: 24.5,
    })
    expect(r.ch).toBe(13)
    expect(r.bruttos).toHaveLength(9)
  })
})

describe('rundeAuswertung', () => {
  it('Netto-Par auf jedem Loch ergibt genau 36 Stableford (18 Loch)', () => {
    const r = neueRunde({
      id: 'r1',
      datum: '2026-07-24T10:00:00.000Z',
      courseId: 'rochushof',
      teeId: 'gelb',
      holes: 18,
      handicapIndex: 24.5,
    })
    const holes = getHoles(getCourse('rochushof'), 18)
    // Brutto = Par + Vorgabe -> jedes Loch 2 Punkte
    r.bruttos = holes.map((h, i) => h.par + r.vorgaben[i])
    const a = rundeAuswertung(r)
    expect(a.stablefordSumme).toBe(36)
    expect(a.sollPunkte).toBe(36)
    // adjGross = Summe(Par) + CH = 72 + 26 = 98
    expect(a.adjGross).toBe(98)
    // SD = (113/133)*(98-69,0) = 24,6
    expect(a.differential).toBe(24.6)
    expect(a.gespielteLoecher).toBe(18)
  })

  it('9-Loch-Runde hat noch kein direktes Differential (wartend)', () => {
    const r = neueRunde({
      id: 'r2',
      datum: '2026-07-24T10:00:00.000Z',
      courseId: 'rochushof',
      teeId: 'gelb',
      holes: 9,
      handicapIndex: 24.5,
    })
    const holes = getHoles(getCourse('rochushof'), 9)
    r.bruttos = holes.map((h, i) => h.par + r.vorgaben[i])
    const a = rundeAuswertung(r)
    expect(a.differential).toBe(null)
    expect(a.sollPunkte).toBe(18)
  })

  it('speichert cr/slope fuer die spaetere Differential-Auswertung', () => {
    const tee = getTee(getCourse('rochushof'), 'gelb')
    const r = neueRunde({
      id: 'r3',
      datum: '2026-07-24T10:00:00.000Z',
      courseId: 'rochushof',
      teeId: 'gelb',
      holes: 18,
      handicapIndex: 24.5,
    })
    const a = rundeAuswertung(r)
    expect(a.cr).toBe(tee.cr)
    expect(a.slope).toBe(tee.slope)
  })
})
