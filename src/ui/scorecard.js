import { el } from './dom.js'
import { getActiveRound, getRounds, addRound, deleteRound } from '../state/store.js'
import { getCourse, getHoles } from '../data/course.js'
import { rundeAuswertung, archiviereRunde } from '../core/round.js'
import { differentialsAusRunden, handicapIndexAus } from '../core/handicap.js'
import { formatKomma, formatVorzeichen } from '../core/format.js'

function indexAus(rounds) {
  const sortiert = [...rounds].sort((a, b) => (a.datum < b.datum ? -1 : 1))
  const { differentials } = differentialsAusRunden(sortiert)
  return handicapIndexAus(differentials)
}

function scorecardTabelle(runde, holeList, a) {
  const rows = holeList.map((h, i) =>
    el('tr', {}, [
      el('td.loch', { text: `${h.nr}` }),
      el('td', { text: h.par }),
      el('td', { text: runde.vorgaben[i] === 0 ? '–' : formatVorzeichen(runde.vorgaben[i]) }),
      el('td', { text: runde.bruttos[i] ?? '–' }),
      el('td', { text: a.nettoProLoch[i] ?? '–' }),
      el('td', { text: a.punkteProLoch[i] ?? '–' }),
    ]),
  )
  const sumPar = holeList.reduce((s, h) => s + h.par, 0)
  const sumVorgabe = runde.vorgaben.reduce((s, v) => s + v, 0)
  rows.push(
    el('tr.sum', {}, [
      el('td.loch', { text: 'Σ' }),
      el('td', { text: sumPar }),
      el('td', { text: formatVorzeichen(sumVorgabe) }),
      el('td', { text: a.bruttoSumme }),
      el('td', { text: a.nettoSumme }),
      el('td', { text: a.stablefordSumme }),
    ]),
  )
  return el('.tbl-scroll', {}, [
    el('table', {}, [
      el('thead', {}, [el('tr', {}, ['Loch', 'Par', 'Vorg.', 'Brutto', 'Netto', 'Pkt'].map((t) => el('th', { class: t === 'Loch' ? 'loch' : '', text: t })))]),
      el('tbody', {}, rows),
    ]),
  ])
}

export function scorecardView({ go, params }) {
  const archiviert = params?.id
  const rounds = getRounds()
  const runde = archiviert ? rounds.find((r) => r.id === params.id) : getActiveRound()

  const main = el('main')
  if (!runde) {
    main.append(el('.card', {}, ['Keine Runde gefunden. ', el('button.primary', { text: 'Zur Startseite', onClick: () => go('#/') })]))
    return { title: 'Scorecard', back: '#/', body: main }
  }

  const course = getCourse(runde.courseId)
  const holeList = getHoles(course, runde.holes)
  const a = rundeAuswertung(runde)
  const sollDiff = a.stablefordSumme - a.sollPunkte

  // Index-Vorschau: bestehende Runden (ohne diese) + diese Runde
  const ohneDiese = rounds.filter((r) => r.id !== runde.id)
  const alterIndex = indexAus(ohneDiese)
  const neuerIndex = indexAus([...ohneDiese, archiviereRunde(runde)])

  main.append(
    el('.card', {}, [
      el('h2', { text: `${course.name} · ${runde.holes} Loch` }),
      el('.muted', { text: `${runde.datum.slice(0, 10)} · Abschlag ${runde.teeId} · CH ${formatVorzeichen(runde.ch)}` }),
    ]),
    el('.card', {}, [scorecardTabelle(runde, holeList, a)]),
    el('.kpi-row', {}, [
      el('.kpi', {}, [el('.val', { text: a.stablefordSumme }), el('.lab', { text: 'Stableford' })]),
      el('.kpi', {}, [el('.val', { text: `${sollDiff >= 0 ? '+' : ''}${sollDiff}` }), el('.lab', { text: `ggü. Soll (${a.sollPunkte})` })]),
      el('.kpi', {}, [el('.val', { text: a.bruttoSumme }), el('.lab', { text: 'Brutto' })]),
      el('.kpi', {}, [el('.val', { text: a.nettoSumme }), el('.lab', { text: 'Netto' })]),
    ]),
    el('.card.center', {}, [
      el('.muted', { text: 'Score Differential dieser Runde' }),
      el('.big-index', { text: a.differential == null ? 'wartend' : formatKomma(a.differential, 1) }),
      a.differential == null
        ? el('.muted', { text: '9-Loch-Runde – ergibt erst mit einer zweiten 9-Loch-Runde ein Differential.' })
        : el('.muted', { text: `Adjusted Gross ${a.adjGross} · CR ${formatKomma(a.cr, 1)} · Slope ${a.slope}` }),
    ]),
    el('.card.center', {}, [
      el('.muted', { text: 'Rechnerischer Handicap-Index (inoffiziell)' }),
      el('div', { style: 'display:flex;gap:16px;justify-content:center;align-items:baseline' }, [
        el('span', { class: 'muted', text: alterIndex == null ? '—' : formatKomma(alterIndex, 1) }),
        el('span', { text: '→' }),
        el('span', { class: 'big-index', text: neuerIndex == null ? '—' : formatKomma(neuerIndex, 1) }),
      ]),
    ]),
  )

  if (archiviert) {
    main.append(
      el('.btn-row', {}, [
        el('button.ghost', { text: 'Zum Archiv', onClick: () => go('#/archive') }),
        el('button.danger', {
          text: 'Runde löschen',
          onClick: () => {
            if (confirm('Diese Runde löschen?')) {
              deleteRound(runde.id)
              go('#/archive')
            }
          },
        }),
      ]),
    )
  } else {
    main.append(
      el('.btn-row', {}, [
        el('button.ghost', { text: '‹ Weiter zählen', onClick: () => go('#/play') }),
        el('button.primary', {
          text: 'Runde speichern',
          onClick: () => {
            addRound(archiviereRunde(runde))
            go('#/')
          },
        }),
      ]),
    )
  }

  return { title: 'Scorecard', back: archiviert ? '#/archive' : '#/play', body: main }
}
