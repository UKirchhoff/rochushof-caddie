import { describe, it, expect } from 'vitest'
import {
  scoreDifferential,
  handicapIndexAus,
  differentialsAusRunden,
  indexVerlauf,
} from '../src/core/handicap.js'

describe('scoreDifferential (18 Loch)', () => {
  it('adjGross 90 / CR 69,0 / Slope 133 -> 17,8', () => {
    // (113/133)*(90-69,0) = 17,842 -> 17,8
    expect(scoreDifferential(90, 69.0, 133)).toBe(17.8)
  })
  it('adjGross 78 / CR 69,2 / Slope 125 -> 7,9', () => {
    // (113/125)*(78-69,2) = 0,904*8,8 = 7,955 -> 8,0
    expect(scoreDifferential(78, 69.2, 125)).toBe(8.0)
  })
})

describe('handicapIndexAus (Best-8-of-20 + WHS-Kleinserien)', () => {
  it('20 Differentials -> Durchschnitt der besten 8, auf 1 NK', () => {
    // beste 8 von 10..29: 10..17 -> Summe 108 / 8 = 13,5
    const diffs = Array.from({ length: 20 }, (_, i) => 10 + i)
    expect(handicapIndexAus(diffs)).toBe(13.5)
  })
  it('nutzt nur die letzten 20 Runden', () => {
    // 25 Werte; die ersten 5 sind sehr niedrig, duerfen aber nicht zaehlen
    const diffs = [0, 0, 0, 0, 0, ...Array.from({ length: 20 }, (_, i) => 10 + i)]
    expect(handicapIndexAus(diffs)).toBe(13.5)
  })
  it('3 Differentials -> niedrigstes minus 2,0', () => {
    expect(handicapIndexAus([20, 21, 22])).toBe(18.0)
  })
  it('4 Differentials -> niedrigstes minus 1,0', () => {
    expect(handicapIndexAus([20, 21, 22, 25])).toBe(19.0)
  })
  it('5 Differentials -> niedrigstes', () => {
    expect(handicapIndexAus([20, 21, 22, 23, 24])).toBe(20.0)
  })
  it('6 Differentials -> Durchschnitt der besten 2 minus 1,0', () => {
    // beste 2 = 20,21 -> 20,5 - 1,0 = 19,5
    expect(handicapIndexAus([20, 21, 22, 23, 24, 25])).toBe(19.5)
  })
  it('8 Differentials -> Durchschnitt der besten 2', () => {
    expect(handicapIndexAus([20, 21, 22, 23, 24, 25, 26, 27])).toBe(20.5)
  })
  it('leere Liste -> null', () => {
    expect(handicapIndexAus([])).toBe(null)
  })
})

describe('differentialsAusRunden (18- und 9-Loch-Logik)', () => {
  it('18-Loch-Runde ergibt direkt ein Differential', () => {
    const runden = [{ holes: 18, adjGross: 90, cr: 69.0, slope: 133 }]
    const { differentials, wartend } = differentialsAusRunden(runden)
    expect(differentials).toEqual([17.8])
    expect(wartend).toBe(false)
  })

  it('einzelne 9-Loch-Runde ist "wartend", ergibt noch kein Differential', () => {
    const runden = [{ holes: 9, adjGross: 45, cr: 69.0, slope: 133 }]
    const { differentials, wartend } = differentialsAusRunden(runden)
    expect(differentials).toEqual([])
    expect(wartend).toBe(true)
  })

  it('zwei 9-Loch-Runden ergeben zusammen ein 18-Loch-Differential', () => {
    const runden = [
      { holes: 9, adjGross: 45, cr: 69.0, slope: 133 },
      { holes: 9, adjGross: 45, cr: 69.0, slope: 133 },
    ]
    const { differentials, wartend } = differentialsAusRunden(runden)
    // adjGross18=90, cr=34,5+34,5=69,0, slope 133 -> 17,8
    expect(differentials).toEqual([17.8])
    expect(wartend).toBe(false)
  })

  it('drei 9-Loch-Runden: ein Paar kombiniert, eine bleibt wartend', () => {
    const runden = [
      { holes: 9, adjGross: 45, cr: 69.0, slope: 133 },
      { holes: 9, adjGross: 45, cr: 69.0, slope: 133 },
      { holes: 9, adjGross: 45, cr: 69.0, slope: 133 },
    ]
    const { differentials, wartend } = differentialsAusRunden(runden)
    expect(differentials).toEqual([17.8])
    expect(wartend).toBe(true)
  })
})

describe('indexVerlauf', () => {
  it('liefert den fortgeschriebenen Index nach jeder Runde', () => {
    const diffs = [20, 21, 22]
    // nach 1: [20] -> 20-2=18 ; nach 2: [20,21] -> 20-2=18 ; nach 3: 18
    expect(indexVerlauf(diffs)).toEqual([18.0, 18.0, 18.0])
  })
})
