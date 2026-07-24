import { el } from './dom.js'
import { getActiveRound, getRounds, clearActiveRound, getSettings, speichereSettings } from '../state/store.js'
import { differentialsAusRunden, handicapIndexAus } from '../core/handicap.js'
import { formatKomma, parseKomma } from '../core/format.js'

function aktuellerIndex(rounds) {
  const sortiert = [...rounds].sort((a, b) => (a.datum < b.datum ? -1 : 1))
  const { differentials, wartend } = differentialsAusRunden(sortiert)
  return { index: handicapIndexAus(differentials), wartend, anzahl: differentials.length }
}

export function homeView({ go }) {
  const active = getActiveRound()
  const rounds = getRounds()
  const settings = getSettings()
  const { index, wartend, anzahl } = aktuellerIndex(rounds)

  const body = el('main', {}, [
    // Handicap-Index-Karte
    el('.card.center', {}, [
      el('.muted', { text: 'Rechnerischer Handicap-Index (inoffiziell)' }),
      el('.big-index', { text: index == null ? '—' : formatKomma(index, 1) }),
      el('.muted', {
        text:
          anzahl === 0
            ? 'Noch keine gewertete Runde'
            : `aus ${anzahl} Runde${anzahl === 1 ? '' : 'n'}${wartend ? ' · eine 9-Loch-Runde wartet auf Ergänzung' : ''}`,
      }),
    ]),

    // Handicap-Index Eingabe (gemerkt)
    (() => {
      const input = el('input', {
        type: 'text',
        inputmode: 'decimal',
        value: settings.handicapIndex == null ? '' : formatKomma(settings.handicapIndex, 1),
        placeholder: 'z. B. 24,5',
        'aria-label': 'Mein Handicap-Index',
      })
      input.addEventListener('change', () => {
        const v = parseKomma(input.value)
        speichereSettings({ handicapIndex: Number.isNaN(v) ? null : v })
      })
      return el('.card', {}, [
        el('label', { text: 'Mein Handicap-Index (für neue Runden)' }),
        input,
        el('.muted', { text: 'Plus-Handicap mit Minus eingeben, z. B. -1,5' }),
      ])
    })(),

    // Laufende Runde
    active
      ? el('.card', {}, [
          el('h2', { text: 'Angefangene Runde' }),
          el('.muted', {
            text: `${active.holes} Loch · ${active.datum.slice(0, 10)} · ${active.bruttos.filter((b) => b != null).length}/${active.holes} Löcher gezählt`,
          }),
          el('.btn-row', { style: 'margin-top:12px' }, [
            el('button.primary', { text: 'Runde fortsetzen', onClick: () => go('#/play') }),
            el('button.danger', {
              text: 'Verwerfen',
              onClick: () => {
                if (confirm('Angefangene Runde wirklich verwerfen?')) {
                  clearActiveRound()
                  go('#/')
                }
              },
            }),
          ]),
        ])
      : el('button.menu-btn', { onClick: () => go('#/setup') }, [
          el('span.ico', { text: '⛳' }),
          el('span', {}, [el('span.t', { text: 'Neue Runde starten' }), el('br'), el('span.s', { text: 'Abschlag & Löcher wählen' })]),
        ]),

    el('button.menu-btn', { onClick: () => go('#/archive') }, [
      el('span.ico', { text: '📋' }),
      el('span', {}, [el('span.t', { text: 'Rundenarchiv' }), el('br'), el('span.s', { text: `${rounds.length} gespeicherte Runde${rounds.length === 1 ? '' : 'n'}` })]),
    ]),
    el('button.menu-btn', { onClick: () => go('#/stats') }, [
      el('span.ico', { text: '📈' }),
      el('span', {}, [el('span.t', { text: 'Statistik' }), el('br'), el('span.s', { text: 'Verlauf & Loch-Auswertung' })]),
    ]),
    el('button.menu-btn', { onClick: () => go('#/data') }, [
      el('span.ico', { text: '💾' }),
      el('span', {}, [el('span.t', { text: 'Daten sichern' }), el('br'), el('span.s', { text: 'Export / Import (JSON, CSV)' })]),
    ]),

    el('.footer-note', {
      text: 'Inoffizieller Index – offiziell zählt nur der DGV. Alle Daten bleiben auf diesem Gerät.',
    }),
  ])

  return { title: 'Rochushof Caddie', back: null, body }
}
