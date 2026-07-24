// Persistenz auf dem Geraet ueber localStorage. Ein einziges JSON-Wurzelobjekt.
// Die reinen Helfer (leererStand, mergeState, toCSV) sind ohne Browser testbar;
// die load/save-Funktionen greifen auf localStorage zu.

import { formatKomma } from '../core/format.js'
import { DEFAULT_COURSE_ID } from '../data/course.js'

const STORAGE_KEY = 'rochushof.v1'
export const SCHEMA_VERSION = 1

/** Leerer Ausgangszustand. */
export function leererStand() {
  return {
    version: SCHEMA_VERSION,
    settings: {
      handicapIndex: null,
      teeId: 'gelb',
      defaultHoles: 18,
      courseId: DEFAULT_COURSE_ID,
    },
    activeRound: null,
    rounds: [],
  }
}

// --- Persistenz -----------------------------------------------------------

/** Laedt den Stand aus localStorage (oder liefert einen leeren Stand). */
export function ladeStand() {
  try {
    const roh = localStorage.getItem(STORAGE_KEY)
    if (!roh) return leererStand()
    const stand = JSON.parse(roh)
    return { ...leererStand(), ...stand, settings: { ...leererStand().settings, ...stand.settings } }
  } catch {
    return leererStand()
  }
}

/** Speichert den Stand nach localStorage. */
export function speichereStand(stand) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stand))
  return stand
}

// --- Bequeme Teil-Zugriffe (lesen + schreiben in einem) --------------------

export function getSettings() {
  return ladeStand().settings
}

export function speichereSettings(patch) {
  const stand = ladeStand()
  stand.settings = { ...stand.settings, ...patch }
  return speichereStand(stand).settings
}

export function getActiveRound() {
  return ladeStand().activeRound
}

export function setActiveRound(runde) {
  const stand = ladeStand()
  stand.activeRound = runde
  speichereStand(stand)
  return runde
}

export function clearActiveRound() {
  const stand = ladeStand()
  stand.activeRound = null
  speichereStand(stand)
}

export function getRounds() {
  return ladeStand().rounds
}

/** Fuegt eine abgeschlossene Runde hinzu und leert die laufende Runde. */
export function addRound(runde) {
  const stand = ladeStand()
  stand.rounds = [...stand.rounds, runde]
  stand.activeRound = null
  speichereStand(stand)
  return stand.rounds
}

export function deleteRound(id) {
  const stand = ladeStand()
  stand.rounds = stand.rounds.filter((r) => r.id !== id)
  speichereStand(stand)
  return stand.rounds
}

// --- Export / Import (reine Helfer) ---------------------------------------

/** Kompletter Stand als hübsch formatiertes JSON. */
export function exportJSON() {
  return JSON.stringify(ladeStand(), null, 2)
}

/**
 * Fuehrt einen importierten Stand mit dem aktuellen zusammen.
 * @param {object} current
 * @param {object} incoming
 * @param {'merge'|'replace'} mode
 */
export function mergeState(current, incoming, mode) {
  if (mode === 'replace') {
    return { ...leererStand(), ...incoming, settings: { ...leererStand().settings, ...incoming.settings } }
  }
  // merge: Runden nach id vereinigen (eingehende gewinnt), Settings mischen,
  // laufende Runde des aktuellen Stands behalten.
  const byId = new Map()
  for (const r of current.rounds ?? []) byId.set(r.id, r)
  for (const r of incoming.rounds ?? []) byId.set(r.id, r)
  return {
    version: SCHEMA_VERSION,
    settings: { ...current.settings, ...incoming.settings },
    activeRound: current.activeRound ?? incoming.activeRound ?? null,
    rounds: [...byId.values()],
  }
}

/** Wendet einen Import an und persistiert das Ergebnis. */
export function importJSON(jsonText, mode) {
  const incoming = JSON.parse(jsonText)
  const merged = mergeState(ladeStand(), incoming, mode)
  return speichereStand(merged)
}

/**
 * CSV-Export der Runden (fuer Excel): Semikolon-Trenner, Komma-Dezimal.
 * @param {object[]} rounds
 */
export function toCSV(rounds) {
  const kopf = [
    'Datum',
    'Platz',
    'Abschlag',
    'Loecher',
    'Handicap-Index',
    'Course-Handicap',
    'Brutto',
    'Netto',
    'Stableford',
    'Score-Differential',
  ]
  const zeilen = rounds.map((r) => {
    const datum = (r.datum || '').slice(0, 10)
    return [
      datum,
      r.courseId ?? '',
      r.teeId ?? '',
      r.holes ?? '',
      formatKomma(r.handicapIndex, 1),
      r.ch ?? '',
      r.bruttoSumme ?? '',
      r.nettoSumme ?? '',
      r.stablefordSumme ?? '',
      r.differential == null ? 'wartend' : formatKomma(r.differential, 1),
    ].join(';')
  })
  return [kopf.join(';'), ...zeilen].join('\n')
}
