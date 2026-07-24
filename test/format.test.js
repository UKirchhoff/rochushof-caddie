import { describe, it, expect } from 'vitest'
import { rundeKaufmaennisch, runde1, parseKomma, formatKomma } from '../src/core/format.js'

describe('rundeKaufmaennisch (kaufmaennisch, 0,5 vom Nullpunkt weg)', () => {
  it('rundet 25,836 auf 26', () => {
    expect(rundeKaufmaennisch(25.836)).toBe(26)
  })
  it('rundet 2,5 auf 3 (vom Nullpunkt weg)', () => {
    expect(rundeKaufmaennisch(2.5)).toBe(3)
  })
  it('rundet -2,5 auf -3 (vom Nullpunkt weg, nicht -2)', () => {
    expect(rundeKaufmaennisch(-2.5)).toBe(-3)
  })
  it('rundet -5,354 auf -5', () => {
    expect(rundeKaufmaennisch(-5.354)).toBe(-5)
  })
})

describe('runde1 (eine Nachkommastelle)', () => {
  it('rundet 17,8421 auf 17,8', () => {
    expect(runde1(17.8421)).toBe(17.8)
  })
  it('rundet 17,85 auf 17,9', () => {
    expect(runde1(17.85)).toBe(17.9)
  })
  it('rundet -3,25 auf -3,3 (vom Nullpunkt weg)', () => {
    expect(runde1(-3.25)).toBe(-3.3)
  })
})

describe('parseKomma (deutsche Dezimaleingabe)', () => {
  it('liest "24,5" als 24.5', () => {
    expect(parseKomma('24,5')).toBe(24.5)
  })
  it('akzeptiert auch Punkt "24.5"', () => {
    expect(parseKomma('24.5')).toBe(24.5)
  })
  it('liest negatives Plus-Handicap "-2,0"', () => {
    expect(parseKomma('-2,0')).toBe(-2)
  })
  it('gibt NaN bei leerem/ungueltigem Text', () => {
    expect(Number.isNaN(parseKomma(''))).toBe(true)
    expect(Number.isNaN(parseKomma('abc'))).toBe(true)
  })
})

describe('formatKomma (Ausgabe mit Komma)', () => {
  it('formatiert 24.5 mit 1 Nachkommastelle als "24,5"', () => {
    expect(formatKomma(24.5, 1)).toBe('24,5')
  })
  it('formatiert 26 ohne Nachkommastellen als "26"', () => {
    expect(formatKomma(26, 0)).toBe('26')
  })
  it('formatiert -5 als "-5"', () => {
    expect(formatKomma(-5, 0)).toBe('-5')
  })
})
