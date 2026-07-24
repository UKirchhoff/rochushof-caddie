// Handicap-Index-Berechnung (inoffiziell) als reine Funktionen.
// Der hier berechnete Index ist NICHT offiziell (offiziell zaehlt nur der DGV;
// kein PCC-Wetterfaktor). Siehe README / UI-Hinweis.

import { runde1 } from './format.js'

const PAR_9 = 36 // fuer die 9-Loch-Kombination genutzt (CR9 = CR18/2)

/**
 * Score Differential einer 18-Loch-Runde.
 * SD = (113/Slope) * (Adjusted Gross - CR), auf 1 Nachkommastelle.
 */
export function scoreDifferential(adjGross, cr, slope) {
  return runde1((113 / slope) * (adjGross - cr))
}

/**
 * WHS-Staffel: wie viele der besten Differentials zaehlen und welche Anpassung
 * gilt, abhaengig von der Anzahl vorliegender (max. 20) Differentials.
 * Quelle: WHS "Handicap Index calculation - fewer than 20 scores".
 */
function staffel(n) {
  if (n <= 0) return null
  if (n <= 3) return { count: 1, adjustment: 2.0 } // offiziell ab 3 Runden
  if (n === 4) return { count: 1, adjustment: 1.0 }
  if (n === 5) return { count: 1, adjustment: 0 }
  if (n === 6) return { count: 2, adjustment: 1.0 }
  if (n <= 8) return { count: 2, adjustment: 0 }
  if (n <= 11) return { count: 3, adjustment: 0 }
  if (n <= 14) return { count: 4, adjustment: 0 }
  if (n <= 16) return { count: 5, adjustment: 0 }
  if (n <= 18) return { count: 6, adjustment: 0 }
  if (n === 19) return { count: 7, adjustment: 0 }
  return { count: 8, adjustment: 0 } // 20
}

/**
 * (Inoffizieller) Handicap-Index aus einer Liste von Score Differentials.
 * Beruecksichtigt die letzten 20 Runden, mittelt die besten <count> und wendet
 * die WHS-Anpassung fuer kleine Anzahlen an. Ergebnis auf 1 Nachkommastelle.
 *
 * @param {number[]} differentials chronologisch (aeltester zuerst)
 * @returns {number|null} null, wenn keine Differentials vorliegen
 */
export function handicapIndexAus(differentials) {
  const last20 = differentials.slice(-20)
  const regel = staffel(last20.length)
  if (!regel) return null
  const sortiert = [...last20].sort((a, b) => a - b)
  const beste = sortiert.slice(0, regel.count)
  const durchschnitt = beste.reduce((s, x) => s + x, 0) / beste.length
  return runde1(durchschnitt - regel.adjustment)
}

/**
 * Wandelt gespeicherte Runden in eine Liste auswertbarer Score Differentials um.
 *
 * - 18-Loch-Runden ergeben je ein Differential.
 * - 9-Loch-Runden werden nach WHS paarweise zu einem 18-Loch-Differential
 *   kombiniert (Adjusted-Gross-Summe, CR = CR18/2 + CR18/2). Eine uebrig
 *   bleibende einzelne 9-Loch-Runde ist "wartend" (noch kein Differential).
 *
 * @param {{holes:9|18, adjGross:number, cr:number, slope:number}[]} runden chronologisch
 * @returns {{differentials:number[], wartend:boolean}}
 */
export function differentialsAusRunden(runden) {
  const differentials = []
  let offen9 = null // gepufferte, noch nicht kombinierte 9-Loch-Runde

  for (const r of runden) {
    if (r.holes === 9) {
      if (offen9 == null) {
        offen9 = r
      } else {
        const adjGross18 = offen9.adjGross + r.adjGross
        const cr18 = offen9.cr / 2 + r.cr / 2
        const slope = (offen9.slope + r.slope) / 2 // i.d.R. identisch
        differentials.push(scoreDifferential(adjGross18, cr18, slope))
        offen9 = null
      }
    } else {
      differentials.push(scoreDifferential(r.adjGross, r.cr, r.slope))
    }
  }

  return { differentials, wartend: offen9 != null }
}

/**
 * Fortlaufender Index-Verlauf: Index nach jeder Runde (fuer den Statistik-Graphen).
 * @param {number[]} differentials chronologisch
 * @returns {number[]}
 */
export function indexVerlauf(differentials) {
  return differentials.map((_, i) => handicapIndexAus(differentials.slice(0, i + 1)))
}

// PAR_9 wird aktuell nicht direkt benoetigt, dokumentiert aber die CR-Halbierung.
void PAR_9
