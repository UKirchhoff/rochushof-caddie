// Zahl-Formatierung und kaufmaennische Rundung.
// Reine Funktionen, kein DOM, keine Storage-Abhaengigkeit.

/**
 * Kaufmaennische Rundung auf ganze Zahl: 0,5 wird vom Nullpunkt weg gerundet.
 * (Math.round rundet -2,5 zu -2; wir wollen -3.)
 */
export function rundeKaufmaennisch(x) {
  return Math.sign(x) * Math.round(Math.abs(x))
}

/** Rundung auf eine Nachkommastelle, kaufmaennisch. */
export function runde1(x) {
  return (Math.sign(x) * Math.round(Math.abs(x) * 10)) / 10
}

/**
 * Liest eine deutsche Dezimaleingabe: Komma oder Punkt als Trennzeichen.
 * Liefert NaN bei leerem/ungueltigem Text.
 */
export function parseKomma(str) {
  if (typeof str !== 'string') return typeof str === 'number' ? str : NaN
  const trimmed = str.trim().replace(',', '.')
  if (trimmed === '') return NaN
  return Number(trimmed)
}

/**
 * Formatiert eine Zahl mit Komma als Dezimaltrennzeichen.
 * @param {number} num
 * @param {number} decimals Anzahl Nachkommastellen (Standard 1)
 */
export function formatKomma(num, decimals = 1) {
  if (num == null || Number.isNaN(num)) return '–'
  return num.toFixed(decimals).replace('.', ',')
}

/** Vorzeichenbehaftete Ganzzahl-Anzeige (z.B. Course Handicap): "+3" / "-2" / "0". */
export function formatVorzeichen(num) {
  if (num > 0) return `+${num}`
  return String(num)
}
