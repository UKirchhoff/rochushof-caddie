import { el, clear } from './dom.js'
import { getActiveRound, setActiveRound } from '../state/store.js'
import { getCourse, getTee, getHoles } from '../data/course.js'
import { stablefordLoch, nettoDoppelbogeyGrenze } from '../core/scoring.js'

function vorgabeStriche(v) {
  if (v > 0) return '/'.repeat(v)
  if (v < 0) return String(v)
  return '–'
}

export function playView({ go }) {
  const runde = getActiveRound()
  const main = el('main')

  if (!runde) {
    main.append(el('.card', {}, ['Keine laufende Runde. ', el('button.primary', { text: 'Neue Runde', onClick: () => go('#/setup') })]))
    return { title: 'Zählen', back: '#/', body: main }
  }

  const course = getCourse(runde.courseId)
  const tee = getTee(course, runde.teeId)
  const holeList = getHoles(course, runde.holes)
  runde.aktuellesLoch ??= 0

  const persist = () => setActiveRound(runde)

  function stelleLoch(i) {
    runde.aktuellesLoch = Math.max(0, Math.min(holeList.length - 1, i))
    // Beim ersten Betreten mit Par vorbelegen (glove-friendly: nur noch anpassen).
    if (runde.bruttos[runde.aktuellesLoch] == null) {
      runde.bruttos[runde.aktuellesLoch] = holeList[runde.aktuellesLoch].par
    }
    persist()
    renderLoch()
  }

  function aendere(delta) {
    const i = runde.aktuellesLoch
    const neu = Math.max(1, (runde.bruttos[i] ?? holeList[i].par) + delta)
    runde.bruttos[i] = neu
    persist()
    renderLoch()
  }

  function renderUebersicht() {
    const grid = el('.holes-grid', {}, holeList.map((h, i) =>
      el('button', {
        class: [i === runde.aktuellesLoch ? 'current' : '', runde.bruttos[i] == null ? 'empty' : ''].join(' '),
        onClick: () => stelleLoch(i),
      }, [
        el('span.n', { text: h.nr }),
        el('span.p', { text: runde.bruttos[i] == null ? `Par ${h.par}` : `${runde.bruttos[i]}` }),
      ]),
    ))
    clear(main)
    main.append(
      el('.card', {}, [el('h2', { text: 'Loch-Übersicht' }), grid]),
      el('.btn-row', {}, [
        el('button.ghost', { text: '‹ Zurück zum Loch', onClick: renderLoch }),
        el('button.primary', { text: 'Runde abschließen', onClick: () => go('#/scorecard') }),
      ]),
    )
  }

  function renderLoch() {
    const i = runde.aktuellesLoch
    const h = holeList[i]
    const v = runde.vorgaben[i]
    const brutto = runde.bruttos[i]
    const punkte = stablefordLoch(h.par, v, brutto)
    const netto = brutto == null ? null : brutto - v
    const grenze = nettoDoppelbogeyGrenze(h.par, v)
    const aufnehmen = brutto != null && brutto >= grenze

    clear(main)
    main.append(
      el('.card.hole', {}, [
        el('.hole-head', {}, [
          el('span.hole-nr', { text: `Loch ${h.nr}` }),
          el('span', { class: 'muted', text: `${i + 1} / ${holeList.length}` }),
        ]),
        el('.hole-meta', {}, [
          el('span', {}, ['Par ', el('b', { text: h.par })]),
          el('span', {}, ['SI ', el('b', { text: h.strokeIndex })]),
          el('span', {}, [el('b', { text: h.laenge[runde.teeId] }), ' m']),
        ]),
        el('.vorgabe-striche', { title: 'Vorgabeschläge', text: vorgabeStriche(v) }),
        el('.score-big', { text: brutto ?? '–' }),
        el('.counter', {}, [
          el('button.minus', { text: '−', 'aria-label': 'Schlag weniger', onClick: () => aendere(-1) }),
          el('button.plus', { text: '+', 'aria-label': 'Schlag mehr', onClick: () => aendere(+1) }),
        ]),
        aufnehmen ? el('.warn', { style: 'margin-top:14px', text: '⛳ Netto-Doppelbogey erreicht – Ball aufnehmen (0 Punkte)' }) : null,
        el('.live', {}, [
          el('.box', {}, [el('.val', { text: punkte ?? '–' }), el('.lab', { text: 'Stableford' })]),
          el('.box', {}, [el('.val', { text: netto ?? '–' }), el('.lab', { text: 'Netto' })]),
        ]),
      ]),
      el('.hole-nav', {}, [
        el('button.ghost', { text: '‹', 'aria-label': 'vorheriges Loch', disabled: i === 0, onClick: () => stelleLoch(i - 1) }),
        el('button.ghost', { text: 'Übersicht', onClick: renderUebersicht }),
        i === holeList.length - 1
          ? el('button.primary', { text: 'Abschließen', onClick: () => go('#/scorecard') })
          : el('button.ghost', { text: '›', 'aria-label': 'nächstes Loch', onClick: () => stelleLoch(i + 1) }),
      ]),
    )
  }

  // Beim Start ggf. aktuelles Loch mit Par vorbelegen
  if (runde.bruttos[runde.aktuellesLoch] == null) {
    runde.bruttos[runde.aktuellesLoch] = holeList[runde.aktuellesLoch].par
    persist()
  }
  renderLoch()

  return { title: `${course.name}`, back: '#/', body: main }
}
