// Zusammenbau und Auswertung einer Runde. Reine Funktionen (nur Platzdaten +
// core-Logik), damit Setup und Scorecard testbar bleiben.

import { getCourse, getTee, getHoles } from '../data/course.js'
import {
  courseHandicap,
  verteileVorgabe,
  stablefordLoch,
  adjustedGross,
} from './scoring.js'
import { scoreDifferential } from './handicap.js'

/**
 * Erzeugt eine neue (leere) Runde inkl. Course Handicap und Vorgabeverteilung.
 * @param {{id:string, datum:string, courseId:string, teeId:string, holes:9|18, handicapIndex:number}} p
 */
export function neueRunde({ id, datum, courseId, teeId, holes, handicapIndex }) {
  const course = getCourse(courseId)
  const tee = getTee(course, teeId)
  const holeList = getHoles(course, holes)
  const ch = courseHandicap(handicapIndex, tee, holes)
  const vorgaben = verteileVorgabe(ch, holeList.map((h) => h.strokeIndex))
  return {
    id,
    datum,
    courseId,
    teeId,
    holes,
    handicapIndex,
    ch,
    vorgaben,
    bruttos: holeList.map(() => null),
  }
}

/**
 * Wertet eine Runde aus: Punkte/Netto pro Loch, Summen, Adjusted Gross,
 * Score Differential (nur 18 Loch direkt) sowie cr/slope fuer die Archiv-Logik.
 * @param {ReturnType<typeof neueRunde>} runde
 */
export function rundeAuswertung(runde) {
  const course = getCourse(runde.courseId)
  const tee = getTee(course, runde.teeId)
  const holeList = getHoles(course, runde.holes)
  const pars = holeList.map((h) => h.par)

  const punkteProLoch = holeList.map((h, i) =>
    stablefordLoch(h.par, runde.vorgaben[i], runde.bruttos[i]),
  )
  const nettoProLoch = runde.bruttos.map((b, i) =>
    b == null ? null : b - runde.vorgaben[i],
  )

  const bruttoSumme = runde.bruttos.reduce((s, b) => s + (b ?? 0), 0)
  const nettoSumme = nettoProLoch.reduce((s, x) => s + (x ?? 0), 0)
  const stablefordSumme = punkteProLoch.reduce((s, p) => s + (p ?? 0), 0)
  const adjGross = adjustedGross(pars, runde.vorgaben, runde.bruttos)
  const gespielteLoecher = runde.bruttos.filter((b) => b != null).length

  // 18 Loch -> Differential direkt. 9 Loch -> wartet auf die zweite 9er-Runde.
  const differential =
    runde.holes === 18 ? scoreDifferential(adjGross, tee.cr, tee.slope) : null

  return {
    pars,
    punkteProLoch,
    nettoProLoch,
    bruttoSumme,
    nettoSumme,
    stablefordSumme,
    adjGross,
    differential,
    gespielteLoecher,
    sollPunkte: runde.holes === 18 ? 36 : 18,
    cr: tee.cr,
    slope: tee.slope,
  }
}

/**
 * Fasst eine abgeschlossene Runde als kompakten Archiv-Datensatz zusammen
 * (enthaelt alles, was differentialsAusRunden spaeter braucht).
 */
export function archiviereRunde(runde) {
  const a = rundeAuswertung(runde)
  return {
    ...runde,
    adjGross: a.adjGross,
    cr: a.cr,
    slope: a.slope,
    bruttoSumme: a.bruttoSumme,
    nettoSumme: a.nettoSumme,
    stablefordSumme: a.stablefordSumme,
    differential: a.differential,
  }
}
