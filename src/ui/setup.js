import { el, clear } from './dom.js'
import { getSettings, speichereSettings, setActiveRound } from '../state/store.js'
import { getCourse, getTee } from '../data/course.js'
import { courseHandicap } from '../core/scoring.js'
import { neueRunde } from '../core/round.js'
import { formatKomma, formatVorzeichen, parseKomma } from '../core/format.js'

export function setupView({ go }) {
  const settings = getSettings()
  const course = getCourse(settings.courseId)

  const state = {
    teeId: settings.teeId || 'gelb',
    holes: settings.defaultHoles || 18,
    index: settings.handicapIndex,
  }

  const rechenwegBox = el('.hinweis')

  function aktualisiere() {
    const tee = getTee(course, state.teeId)
    clear(rechenwegBox)
    if (state.index == null || Number.isNaN(state.index)) {
      rechenwegBox.append('Bitte zuerst den Handicap-Index eingeben.')
      startBtn.disabled = true
      return
    }
    startBtn.disabled = false
    const ch = courseHandicap(state.index, tee, state.holes)
    const slopeTeil = state.holes === 18 ? tee.slope : tee.slope
    const idxTeil = state.holes === 18 ? state.index : state.index / 2
    const crTeil = state.holes === 18 ? tee.cr - 72 : tee.cr / 2 - 36
    const formel =
      state.holes === 18
        ? `${formatKomma(state.index, 1)} × (${tee.slope} ÷ 113) + (${formatKomma(tee.cr, 1)} − 72)`
        : `(${formatKomma(state.index, 1)} ÷ 2) × (${tee.slope} ÷ 113) + (${formatKomma(tee.cr, 1)} ÷ 2 − 36)`
    const zwischen = idxTeil * (slopeTeil / 113) + crTeil
    clear(rechenwegBox)
    rechenwegBox.append(
      el('div', {}, [
        el('b', { text: `Course Handicap: ${formatVorzeichen(ch)}` }),
        el('div', { class: 'muted', style: 'margin-top:6px', text: `${formel} = ${formatKomma(zwischen, 2)} → ${formatVorzeichen(ch)}` }),
        el('div', { class: 'muted', text: `${state.holes} Loch · Abschlag ${tee.name} · Slope ${tee.slope} · CR ${formatKomma(tee.cr, 1)}` }),
        el('div', { class: 'muted', text: 'Zum Abgleich mit der Club-Tabelle.' }),
      ]),
    )
  }

  const teeSeg = el('.seg', {}, course.tees.map((t) =>
    el('button', {
      text: t.name,
      'aria-pressed': String(state.teeId === t.id),
      onClick: () => {
        state.teeId = t.id
        teeSeg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(course.tees[i].id === t.id)))
        aktualisiere()
      },
    }),
  ))

  const holesSeg = el('.seg', {}, [9, 18].map((h) =>
    el('button', {
      text: `${h} Loch`,
      'aria-pressed': String(state.holes === h),
      onClick: () => {
        state.holes = h
        holesSeg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String([9, 18][i] === h)))
        aktualisiere()
      },
    }),
  ))

  const indexInput = el('input', {
    type: 'text',
    inputmode: 'decimal',
    value: state.index == null ? '' : formatKomma(state.index, 1),
    placeholder: 'z. B. 24,5',
  })
  indexInput.addEventListener('input', () => {
    const v = parseKomma(indexInput.value)
    state.index = Number.isNaN(v) ? null : v
    aktualisiere()
  })

  const startBtn = el('button.primary', {
    text: 'Runde starten',
    onClick: () => {
      speichereSettings({ teeId: state.teeId, defaultHoles: state.holes, handicapIndex: state.index })
      const runde = neueRunde({
        id: crypto.randomUUID(),
        datum: new Date().toISOString(),
        courseId: course.id,
        teeId: state.teeId,
        holes: state.holes,
        handicapIndex: state.index,
      })
      runde.aktuellesLoch = 0
      setActiveRound(runde)
      go('#/play')
    },
  })

  const body = el('main', {}, [
    el('.card', {}, [el('label', { text: 'Handicap-Index' }), indexInput]),
    el('.card', {}, [el('label', { text: 'Abschlag' }), teeSeg]),
    el('.card', {}, [el('label', { text: 'Runde' }), holesSeg]),
    el('.card', {}, [el('h2', { text: 'Course Handicap' }), rechenwegBox]),
    startBtn,
  ])

  aktualisiere()
  return { title: 'Neue Runde', back: '#/', body }
}
