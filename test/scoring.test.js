import { describe, it, expect } from 'vitest'
import {
  courseHandicap18,
  courseHandicap9,
  verteileVorgabe,
  stablefordLoch,
  nettoDoppelbogeyGrenze,
  adjustedLochScore,
  adjustedGross,
} from '../src/core/scoring.js'
import { getCourse, getTee, getHoles } from '../src/data/course.js'

const gelb = getTee(getCourse('rochushof'), 'gelb') // Slope 133, CR 69,0
const rot = getTee(getCourse('rochushof'), 'rot') // Slope 125, CR 69,2

describe('courseHandicap18', () => {
  it('HCP 24,5 / Gelb / 18 Loch -> 26 (Abgleich Club-Tabelle)', () => {
    // 24,5 * 133/113 + (69,0 - 72) = 25,836 -> 26
    expect(courseHandicap18(24.5, gelb.slope, gelb.cr)).toBe(26)
  })
  it('Plus-Handicap -2,0 / Gelb / 18 -> -5', () => {
    // -2,0 * 133/113 + (69,0-72) = -5,354 -> -5
    expect(courseHandicap18(-2.0, gelb.slope, gelb.cr)).toBe(-5)
  })
  it('hoher Index 30 / Gelb / 18 -> 32 (CH > 18)', () => {
    expect(courseHandicap18(30, gelb.slope, gelb.cr)).toBe(32)
  })
  it('HCP 24,5 / Rot / 18', () => {
    // 24,5*125/113 + (69,2-72) = 27,104 - 2,8 = 24,304 -> 24
    expect(courseHandicap18(24.5, rot.slope, rot.cr)).toBe(24)
  })
})

describe('courseHandicap9', () => {
  it('HCP 24,5 / Gelb / 9 Loch -> 13', () => {
    // (24,5/2)*133/113 + (69,0/2 - 36) = 14,418 - 1,5 = 12,918 -> 13
    expect(courseHandicap9(24.5, gelb.slope, gelb.cr)).toBe(13)
  })
  it('Plus-Handicap -2,0 / Gelb / 9', () => {
    // (-1,0)*133/113 + (34,5-36) = -1,177 - 1,5 = -2,677 -> -3
    expect(courseHandicap9(-2.0, gelb.slope, gelb.cr)).toBe(-3)
  })
  it('nutzt offizielle 9-Loch-Ratings, falls gesetzt', () => {
    // Mit slope9=130, cr9=34,4: (24,5/2)*130/113 + (34,4-36) = 14,093 - 1,6 = 12,493 -> 12
    expect(courseHandicap9(24.5, gelb.slope, gelb.cr, { slope9: 130, cr9: 34.4 })).toBe(12)
  })
})

describe('verteileVorgabe', () => {
  const si18 = getHoles(getCourse('rochushof'), 18).map((h) => h.strokeIndex)
  const si9 = getHoles(getCourse('rochushof'), 9).map((h) => h.strokeIndex)

  it('CH 26 / 18 Loch: alle 1, die 8 schwersten (SI 1..8) je 2', () => {
    const v = verteileVorgabe(26, si18)
    // Summe stimmt
    expect(v.reduce((a, b) => a + b, 0)).toBe(26)
    // Loch 6 hat SI 1 -> 2 Schlaege
    const idxSI1 = si18.indexOf(1)
    expect(v[idxSI1]).toBe(2)
    // ein Loch mit SI 9 -> 1 Schlag
    expect(v[si18.indexOf(9)]).toBe(1)
  })

  it('CH 10 / 18 Loch: nur die 10 schwersten je 1', () => {
    const v = verteileVorgabe(10, si18)
    expect(v.reduce((a, b) => a + b, 0)).toBe(10)
    expect(v[si18.indexOf(1)]).toBe(1)
    expect(v[si18.indexOf(10)]).toBe(1)
    expect(v[si18.indexOf(11)]).toBe(0)
  })

  it('CH 32 / 18 Loch (CH>18): alle 1, die 14 schwersten je 2', () => {
    const v = verteileVorgabe(32, si18)
    expect(v.reduce((a, b) => a + b, 0)).toBe(32)
    expect(v[si18.indexOf(1)]).toBe(2)
    expect(v[si18.indexOf(14)]).toBe(2)
    expect(v[si18.indexOf(15)]).toBe(1)
  })

  it('Plus-Handicap CH -5 / 18 Loch: die 5 leichtesten je -1', () => {
    const v = verteileVorgabe(-5, si18)
    expect(v.reduce((a, b) => a + b, 0)).toBe(-5)
    // leichtestes Loch = hoechster SI = 18
    expect(v[si18.indexOf(18)]).toBe(-1)
    expect(v[si18.indexOf(14)]).toBe(-1)
    expect(v[si18.indexOf(13)]).toBe(0)
    // schwerstes Loch bekommt nichts abgezogen
    expect(v[si18.indexOf(1)]).toBe(0)
  })

  it('CH 13 / 9 Loch: die 9 Loecher der vorderen Neun', () => {
    const v = verteileVorgabe(13, si9)
    expect(v.reduce((a, b) => a + b, 0)).toBe(13)
    // 9 Loecher, base=1 (13/9=1 rest 4) -> alle >=1, die 4 schwersten =2
    expect(Math.min(...v)).toBe(1)
    expect(v.filter((x) => x === 2).length).toBe(4)
  })

  it('CH 0 verteilt keine Schlaege', () => {
    expect(verteileVorgabe(0, si18).every((x) => x === 0)).toBe(true)
  })
})

describe('stablefordLoch', () => {
  it('Par 4, Vorgabe 2, Brutto 5 -> 3 Punkte', () => {
    expect(stablefordLoch(4, 2, 5)).toBe(3)
  })
  it('Netto-Doppelbogey -> 0 Punkte', () => {
    // par4 vorgabe2 -> Grenze brutto 8 -> 0 Punkte
    expect(stablefordLoch(4, 2, 8)).toBe(0)
  })
  it('schlechter als Netto-Doppelbogey bleibt 0 (nie negativ)', () => {
    expect(stablefordLoch(4, 2, 10)).toBe(0)
  })
  it('Netto-Eagle: Par 5, Vorgabe 1, Brutto 4 -> 4 Punkte', () => {
    expect(stablefordLoch(5, 1, 4)).toBe(4)
  })
  it('gibt null bei nicht eingegebenem Brutto', () => {
    expect(stablefordLoch(4, 2, null)).toBe(null)
  })
})

describe('nettoDoppelbogeyGrenze', () => {
  it('Par 4, Vorgabe 2 -> 8 (Ball aufnehmen)', () => {
    expect(nettoDoppelbogeyGrenze(4, 2)).toBe(8)
  })
  it('Par 3, Vorgabe 0 -> 5', () => {
    expect(nettoDoppelbogeyGrenze(3, 0)).toBe(5)
  })
})

describe('adjustedLochScore (Deckelung fuer Differential)', () => {
  it('deckelt Brutto auf Netto-Doppelbogey', () => {
    expect(adjustedLochScore(4, 2, 10)).toBe(8)
  })
  it('laesst besseres Ergebnis unveraendert', () => {
    expect(adjustedLochScore(4, 2, 5)).toBe(5)
  })
  it('nicht gespieltes Loch (null) zaehlt als Netto-Par (par+vorgabe)', () => {
    expect(adjustedLochScore(4, 2, null)).toBe(6)
  })
})

describe('adjustedGross', () => {
  it('summiert gedeckelte Loch-Ergebnisse', () => {
    const pars = [4, 4, 3]
    const vorgaben = [1, 1, 0]
    const bruttos = [5, 9, 3] // Loch 2 wird auf 4+1+2=7 gedeckelt
    // 5 + 7 + 3 = 15
    expect(adjustedGross(pars, vorgaben, bruttos)).toBe(15)
  })
})
