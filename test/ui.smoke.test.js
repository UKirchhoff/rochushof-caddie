// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { homeView } from '../src/ui/home.js'
import { setupView } from '../src/ui/setup.js'
import { playView } from '../src/ui/play.js'
import { scorecardView } from '../src/ui/scorecard.js'
import { archiveView } from '../src/ui/archive.js'
import { statsView } from '../src/ui/stats.js'
import { dataView } from '../src/ui/data.js'
import { leererStand, speichereStand } from '../src/state/store.js'
import { neueRunde, archiviereRunde } from '../src/core/round.js'
import { getCourse, getHoles } from '../src/data/course.js'

const go = () => {}

function fertigeRunde(id, datum, holes = 18) {
  const r = neueRunde({ id, datum, courseId: 'rochushof', teeId: 'gelb', holes, handicapIndex: 24.5 })
  const list = getHoles(getCourse('rochushof'), holes)
  r.bruttos = list.map((h, i) => h.par + r.vorgaben[i]) // Netto-Par ueberall
  return archiviereRunde(r)
}

beforeEach(() => {
  localStorage.clear()
})

describe('UI-Smoke: jede View rendert ohne Fehler', () => {
  it('Home mit leerem Stand', () => {
    const { title, body } = homeView({ go })
    expect(title).toBe('Rochushof Caddie')
    expect(body.textContent).toContain('Neue Runde starten')
  })

  it('Setup zeigt Course Handicap', () => {
    speichereStand({ ...leererStand(), settings: { ...leererStand().settings, handicapIndex: 24.5 } })
    const { body } = setupView({ go })
    expect(body.textContent).toContain('Course Handicap')
    expect(body.textContent).toContain('+26')
  })

  it('Play mit laufender Runde zeigt Loch 1', () => {
    const r = neueRunde({ id: 'live', datum: '2026-07-24T10:00:00Z', courseId: 'rochushof', teeId: 'gelb', holes: 18, handicapIndex: 24.5 })
    speichereStand({ ...leererStand(), activeRound: r })
    const { body } = playView({ go })
    expect(body.textContent).toContain('Loch 1')
    expect(body.textContent).toContain('Stableford')
  })

  it('Scorecard einer laufenden Runde zeigt Summen', () => {
    const r = neueRunde({ id: 'live', datum: '2026-07-24T10:00:00Z', courseId: 'rochushof', teeId: 'gelb', holes: 18, handicapIndex: 24.5 })
    r.bruttos = getHoles(getCourse('rochushof'), 18).map((h, i) => h.par + r.vorgaben[i])
    speichereStand({ ...leererStand(), activeRound: r })
    const { body } = scorecardView({ go, params: {} })
    expect(body.textContent).toContain('Score Differential')
    expect(body.textContent).toContain('36') // Soll erreicht
  })

  it('Archiv, Statistik, Scorecard/:id mit gespeicherten Runden', () => {
    const rounds = [fertigeRunde('a', '2026-06-01T10:00:00Z'), fertigeRunde('b', '2026-07-01T10:00:00Z')]
    speichereStand({ ...leererStand(), rounds })

    expect(archiveView({ go }).body.textContent).toContain('2026-07-01')
    expect(statsView({ go }).body.textContent).toContain('Auswertung pro Loch')
    expect(scorecardView({ go, params: { id: 'a' } }).body.textContent).toContain('Runde löschen')
  })

  it('Daten-View bietet Export/Import', () => {
    const { body } = dataView({ go })
    expect(body.textContent).toContain('JSON')
    expect(body.textContent).toContain('CSV')
  })
})
