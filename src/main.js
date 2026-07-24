import './styles.css'
import { el, mount } from './ui/dom.js'
import { homeView } from './ui/home.js'
import { setupView } from './ui/setup.js'
import { playView } from './ui/play.js'
import { scorecardView } from './ui/scorecard.js'
import { archiveView } from './ui/archive.js'
import { statsView } from './ui/stats.js'
import { dataView } from './ui/data.js'
import { registerSW } from 'virtual:pwa-register'

const appEl = document.querySelector('#app')

function go(hash) {
  if (location.hash === hash) render()
  else location.hash = hash
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/'
  const teile = raw.split('/').filter(Boolean) // ['scorecard','id']
  return { path: '/' + (teile[0] ?? ''), param: teile[1] }
}

const routes = {
  '/': homeView,
  '/setup': setupView,
  '/play': playView,
  '/scorecard': scorecardView,
  '/archive': archiveView,
  '/stats': statsView,
  '/data': dataView,
}

function render() {
  const { path, param } = parseHash()
  const view = routes[path] || homeView
  let ergebnis
  try {
    ergebnis = view({ go, params: param ? { id: param } : {} })
  } catch (e) {
    ergebnis = { title: 'Fehler', back: '#/', body: el('main', {}, [el('.warn', { text: String(e && e.message ? e.message : e) })]) }
  }

  const appbar = el('.appbar', {}, [
    ergebnis.back ? el('button.back', { text: '‹', 'aria-label': 'Zurück', onClick: () => go(ergebnis.back) }) : el('span.back', { style: 'visibility:hidden' }, ['‹']),
    el('h1', { text: ergebnis.title }),
    el('.spacer'),
  ])

  const shell = el('div', {}, [appbar, ergebnis.body])
  mount(appEl, shell)
  window.scrollTo(0, 0)
}

window.addEventListener('hashchange', render)
render()

// Service Worker: bei Update automatisch übernehmen (vollständig offline-fähig).
registerSW({ immediate: true })
