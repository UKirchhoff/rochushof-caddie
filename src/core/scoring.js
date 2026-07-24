// Golf-Rechenlogik (World Handicap System) als reine Funktionen.
// Kein DOM, keine Storage-Abhaengigkeit -> vollstaendig unit-testbar.

import { rundeKaufmaennisch } from './format.js'

const PAR_18 = 72
const PAR_9 = 36

/**
 * Course Handicap 18 Loch.
 * CH = Index * (Slope/113) + (CR - 72), kaufmaennisch gerundet.
 */
export function courseHandicap18(index, slope, cr) {
  return rundeKaufmaennisch(index * (slope / 113) + (cr - PAR_18))
}

/**
 * Course Handicap 9 Loch.
 * Standard (ohne offizielle 9-Loch-Ratings):
 *   CH9 = (Index/2) * (Slope/113) + (CR/2 - 36), kaufmaennisch gerundet.
 *
 * Weist der Club offizielle 9-Loch-Ratings aus (opts.slope9, opts.cr9), wird die
 * WHS-9-Loch-Formel mit diesen Werten verwendet:
 *   CH9 = (Index/2) * (Slope9/113) + (CR9 - 36).
 * Die Ratings sind so leicht austauschbar (siehe data/course.js: slope9/cr9).
 */
export function courseHandicap9(index, slope, cr, opts = {}) {
  const { slope9 = null, cr9 = null } = opts
  if (slope9 != null && cr9 != null) {
    return rundeKaufmaennisch((index / 2) * (slope9 / 113) + (cr9 - PAR_9))
  }
  return rundeKaufmaennisch((index / 2) * (slope / 113) + (cr / 2 - PAR_9))
}

/**
 * Wrapper: Course Handicap fuer 9 oder 18 Loch anhand eines Tee-Objekts.
 * @param {number} index Handicap-Index
 * @param {{slope:number, cr:number, slope9?:number|null, cr9?:number|null}} tee
 * @param {9|18} holes
 */
export function courseHandicap(index, tee, holes) {
  return holes === 9
    ? courseHandicap9(index, tee.slope, tee.cr, { slope9: tee.slope9, cr9: tee.cr9 })
    : courseHandicap18(index, tee.slope, tee.cr)
}

/**
 * Verteilt die Vorgabeschlaege ueber die Loecher nach Stroke-Index.
 *
 * - CH >= 0: die schwersten Loecher (kleinster Stroke-Index) bekommen zuerst
 *   je 1 Schlag; bei CH > Anzahl Loecher folgt eine weitere Verteilungsrunde
 *   (2 Schlaege auf die schwersten usw.).
 * - CH < 0 (Plus-Handicap): auf den leichtesten Loechern (groesster Stroke-Index)
 *   werden Schlaege abgezogen (negativ).
 *
 * @param {number} ch Course Handicap (ganzzahlig)
 * @param {number[]} strokeIndizes Stroke-Index je Loch in Spielreihenfolge
 * @returns {number[]} Vorgabeschlaege je Loch (gleiche Reihenfolge)
 */
export function verteileVorgabe(ch, strokeIndizes) {
  const n = strokeIndizes.length
  const result = new Array(n).fill(0)
  if (ch === 0 || n === 0) return result

  const sign = Math.sign(ch)
  const abs = Math.abs(ch)
  const base = Math.floor(abs / n)
  const rem = abs % n

  // Reihenfolge der Loecher fuer die "Rest"-Verteilung:
  // positiv -> schwerste zuerst (Stroke-Index aufsteigend)
  // negativ -> leichteste zuerst (Stroke-Index absteigend)
  const order = strokeIndizes
    .map((si, i) => ({ si, i }))
    .sort((a, b) => (sign > 0 ? a.si - b.si : b.si - a.si))

  for (let k = 0; k < n; k++) {
    const extra = k < rem ? 1 : 0
    const betrag = base + extra
    result[order[k].i] = betrag === 0 ? 0 : sign * betrag // kein -0
  }
  return result
}

/**
 * Stableford-Punkte fuer ein Loch.
 * Punkte = max(0, 2 + Par + Vorgabeschlaege - Bruttoschlaege).
 * Liefert null, wenn noch kein Brutto eingegeben wurde.
 */
export function stablefordLoch(par, vorgabe, brutto) {
  if (brutto == null) return null
  return Math.max(0, 2 + par + vorgabe - brutto)
}

/**
 * Netto-Doppelbogey-Grenze eines Lochs = Par + Vorgabeschlaege + 2.
 * Ab diesem Bruttoergebnis gibt es 0 Stableford-Punkte -> "Ball aufnehmen".
 */
export function nettoDoppelbogeyGrenze(par, vorgabe) {
  return par + vorgabe + 2
}

/**
 * Fuer das Score Differential gedeckeltes Loch-Ergebnis (max. Netto-Doppelbogey).
 * Nicht gespielte Loecher (brutto == null) zaehlen als Netto-Par (Par + Vorgabe).
 */
export function adjustedLochScore(par, vorgabe, brutto) {
  const grenze = nettoDoppelbogeyGrenze(par, vorgabe)
  if (brutto == null) return par + vorgabe // Netto-Par
  return Math.min(brutto, grenze)
}

/**
 * Adjusted Gross Score = Summe der pro Loch auf Netto-Doppelbogey gedeckelten Ergebnisse.
 * @param {number[]} pars
 * @param {number[]} vorgaben
 * @param {(number|null)[]} bruttos
 */
export function adjustedGross(pars, vorgaben, bruttos) {
  let sum = 0
  for (let i = 0; i < pars.length; i++) {
    sum += adjustedLochScore(pars[i], vorgaben[i], bruttos[i])
  }
  return sum
}
