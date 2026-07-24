// Platzdaten gekapselt, damit spaeter weitere Plaetze ergaenzt werden koennen.
// Ein Platz = { id, name, parGesamt, tees[], holes[] }.
//
// Der GC Rochushof ist ein 9-Loch-Platz, der fuer 18 Loch doppelt gespielt wird.
// Wir hinterlegen dennoch alle 18 Loecher explizit, weil die Stroke-Indizes (HCP)
// der zweiten Runde eigene Werte haben (1..18 durchgaengig).

/**
 * @typedef {Object} Tee
 * @property {string} id            - technischer Schluessel ('gelb' | 'rot')
 * @property {string} name          - Anzeigename
 * @property {number} slope         - Slope Rating (18 Loch)
 * @property {number} cr            - Course Rating (18 Loch)
 * @property {number} laenge18      - Gesamtlaenge 18 Loch in Metern
 * @property {number|null} slope9   - offizielles 9-Loch-Slope, falls vom Club ausgewiesen; sonst null
 * @property {number|null} cr9      - offizielles 9-Loch-Course-Rating, falls ausgewiesen; sonst null
 */

/**
 * @typedef {Object} Hole
 * @property {number} nr
 * @property {number} par
 * @property {number} strokeIndex   - Stroke-Index / HCP-Verteilung (1 = schwerstes Loch)
 * @property {Object<string, number>} laenge - Laenge je Tee-Id in Metern
 */

// HINWEIS 9-Loch-Ratings:
// Weist der Club offizielle 9-Loch-CR/Slope aus, hier bei slope9/cr9 eintragen.
// Die Rechenlogik (core/scoring.js -> courseHandicap9) benutzt diese Werte, falls
// gesetzt, und faellt sonst auf die WHS-Ableitung (Slope18 bzw. CR18/2) zurueck.
const rochushof = {
  id: 'rochushof',
  name: 'GC Rochushof',
  parGesamt: 72,
  tees: [
    { id: 'gelb', name: 'Gelb (Herren)', slope: 133, cr: 69.0, laenge18: 5468, slope9: null, cr9: null },
    { id: 'rot', name: 'Rot (Damen)', slope: 125, cr: 69.2, laenge18: 4678, slope9: null, cr9: null },
  ],
  holes: [
    { nr: 1, par: 5, strokeIndex: 15, laenge: { gelb: 415, rot: 377 } },
    { nr: 2, par: 4, strokeIndex: 17, laenge: { gelb: 236, rot: 198 } },
    { nr: 3, par: 3, strokeIndex: 9, laenge: { gelb: 172, rot: 145 } },
    { nr: 4, par: 4, strokeIndex: 3, laenge: { gelb: 317, rot: 269 } },
    { nr: 5, par: 4, strokeIndex: 13, laenge: { gelb: 295, rot: 252 } },
    { nr: 6, par: 4, strokeIndex: 1, laenge: { gelb: 327, rot: 279 } },
    { nr: 7, par: 4, strokeIndex: 5, laenge: { gelb: 336, rot: 284 } },
    { nr: 8, par: 3, strokeIndex: 11, laenge: { gelb: 193, rot: 146 } },
    { nr: 9, par: 5, strokeIndex: 7, laenge: { gelb: 443, rot: 389 } },
    { nr: 10, par: 5, strokeIndex: 16, laenge: { gelb: 415, rot: 377 } },
    { nr: 11, par: 4, strokeIndex: 18, laenge: { gelb: 236, rot: 198 } },
    { nr: 12, par: 3, strokeIndex: 10, laenge: { gelb: 172, rot: 145 } },
    { nr: 13, par: 4, strokeIndex: 4, laenge: { gelb: 317, rot: 269 } },
    { nr: 14, par: 4, strokeIndex: 14, laenge: { gelb: 295, rot: 252 } },
    { nr: 15, par: 4, strokeIndex: 2, laenge: { gelb: 327, rot: 279 } },
    { nr: 16, par: 4, strokeIndex: 6, laenge: { gelb: 336, rot: 284 } },
    { nr: 17, par: 3, strokeIndex: 12, laenge: { gelb: 193, rot: 146 } },
    { nr: 18, par: 5, strokeIndex: 8, laenge: { gelb: 443, rot: 389 } },
  ],
}

export const COURSES = [rochushof]

/** Standard-Platz (aktuell einziger). */
export const DEFAULT_COURSE_ID = 'rochushof'

/** Liefert einen Platz per Id (oder undefined). */
export function getCourse(id = DEFAULT_COURSE_ID) {
  return COURSES.find((c) => c.id === id)
}

/** Liefert einen Tee eines Platzes per Id (oder undefined). */
export function getTee(course, teeId) {
  return course?.tees.find((t) => t.id === teeId)
}

/**
 * Liefert die relevanten Loecher fuer eine Runde.
 * 18 Loch -> alle 18; 9 Loch -> die ersten 9 (vordere Neun).
 */
export function getHoles(course, holes = 18) {
  return holes === 9 ? course.holes.slice(0, 9) : course.holes
}
