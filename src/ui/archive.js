import { el } from './dom.js'
import { getRounds } from '../state/store.js'
import { getCourse } from '../data/course.js'
import { formatKomma } from '../core/format.js'

export function archiveView({ go }) {
  const rounds = [...getRounds()].sort((a, b) => (a.datum < b.datum ? 1 : -1)) // neueste zuerst
  const main = el('main')

  if (rounds.length === 0) {
    main.append(el('.card.center', {}, [el('p', { text: 'Noch keine gespeicherten Runden.' }), el('button.primary', { text: 'Runde starten', onClick: () => go('#/setup') })]))
    return { title: 'Rundenarchiv', back: '#/', body: main }
  }

  const liste = el('.card', {}, rounds.map((r) => {
    const course = getCourse(r.courseId)
    return el('button.list-item', { style: 'width:100%;background:#fff;border:none;border-bottom:1px solid var(--linie)', onClick: () => go(`#/scorecard/${r.id}`) }, [
      el('span', {}, [
        el('span.d', { text: r.datum.slice(0, 10) }),
        el('br'),
        el('span.muted', { text: `${course?.name ?? r.courseId} · ${r.holes} Loch · ${r.teeId} · ${r.stablefordSumme} Pkt` }),
      ]),
      el('span', { class: r.differential == null ? 'badge wait' : 'badge', text: r.differential == null ? 'wartend' : formatKomma(r.differential, 1) }),
    ])
  }))

  main.append(liste)
  return { title: 'Rundenarchiv', back: '#/', body: main }
}
