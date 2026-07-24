import { el } from './dom.js'
import { getRounds } from '../state/store.js'
import { getCourse, getHoles } from '../data/course.js'
import { differentialsAusRunden, indexVerlauf } from '../core/handicap.js'
import { lineChart } from './chart.js'
import { formatKomma } from '../core/format.js'

// Durchschnittliches Ergebnis relativ zum Par je Loch (ueber alle Runden).
function lochAuswertung(rounds) {
  const agg = new Map() // nr -> { par, summeUeberPar, n }
  for (const r of rounds) {
    const course = getCourse(r.courseId)
    const holeList = getHoles(course, r.holes)
    holeList.forEach((h, i) => {
      const b = r.bruttos[i]
      if (b == null) return
      const e = agg.get(h.nr) || { nr: h.nr, par: h.par, summe: 0, ueberPar: 0, n: 0 }
      e.summe += b
      e.ueberPar += b - h.par
      e.n += 1
      agg.set(h.nr, e)
    })
  }
  return [...agg.values()].map((e) => ({ ...e, avg: e.summe / e.n, avgUeberPar: e.ueberPar / e.n })).sort((a, b) => a.nr - b.nr)
}

export function statsView({ go }) {
  const rounds = [...getRounds()].sort((a, b) => (a.datum < b.datum ? -1 : 1))
  const main = el('main')

  if (rounds.length === 0) {
    main.append(el('.card.center', {}, [el('p', { text: 'Noch keine Daten für die Statistik.' }), el('button.primary', { text: 'Zur Startseite', onClick: () => go('#/') })]))
    return { title: 'Statistik', back: '#/', body: main }
  }

  const { differentials } = differentialsAusRunden(rounds)
  const verlauf = indexVerlauf(differentials)
  const stablefords = rounds.map((r) => r.stablefordSumme)
  const lochData = lochAuswertung(rounds)
  const bestes = lochData.length ? lochData.reduce((a, b) => (b.avgUeberPar < a.avgUeberPar ? b : a)) : null
  const schlechtestes = lochData.length ? lochData.reduce((a, b) => (b.avgUeberPar > a.avgUeberPar ? b : a)) : null

  main.append(
    el('.card', {}, [
      el('h2', { text: 'Handicap-Index-Verlauf (inoffiziell)' }),
      verlauf.length ? lineChart(verlauf, { invertiert: true, format: (v) => formatKomma(v, 1) }) : el('.muted', { text: 'Erst nach einer gewerteten 18-Loch-Runde bzw. zwei 9-Loch-Runden.' }),
    ]),
    el('.card', {}, [el('h2', { text: 'Stableford-Verlauf' }), lineChart(stablefords, { farbe: '#0b6e33', format: (v) => `${Math.round(v)}` })]),
  )

  if (bestes && schlechtestes) {
    main.append(
      el('.kpi-row', {}, [
        el('.kpi', {}, [el('.val', { text: `Loch ${bestes.nr}` }), el('.lab', { text: `bestes · Ø ${formatKomma(bestes.avg, 1)} (Par ${bestes.par})` })]),
        el('.kpi', {}, [el('.val', { text: `Loch ${schlechtestes.nr}` }), el('.lab', { text: `schwerstes · Ø ${formatKomma(schlechtestes.avg, 1)} (Par ${schlechtestes.par})` })]),
      ]),
    )
  }

  const tabelle = el('.tbl-scroll', {}, [
    el('table', {}, [
      el('thead', {}, [el('tr', {}, ['Loch', 'Par', 'Ø Brutto', 'Ø +/-', 'Runden'].map((t) => el('th', { class: t === 'Loch' ? 'loch' : '', text: t })))]),
      el('tbody', {}, lochData.map((e) =>
        el('tr', {}, [
          el('td.loch', { text: e.nr }),
          el('td', { text: e.par }),
          el('td', { text: formatKomma(e.avg, 1) }),
          el('td', { text: `${e.avgUeberPar >= 0 ? '+' : ''}${formatKomma(e.avgUeberPar, 1)}` }),
          el('td', { text: e.n }),
        ]),
      )),
    ]),
  ])
  main.append(el('.card', {}, [el('h2', { text: 'Auswertung pro Loch' }), tabelle]))

  return { title: 'Statistik', back: '#/', body: main }
}
