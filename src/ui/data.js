import { el } from './dom.js'
import { exportJSON, toCSV, getRounds, importJSON } from '../state/store.js'

function datumStempel() {
  return new Date().toISOString().slice(0, 10)
}

// Datei herunterladen bzw. auf iOS den Teilen-Dialog anbieten (iCloud Drive).
async function speichereDatei(inhalt, dateiname, mime) {
  const blob = new Blob([inhalt], { type: mime })
  const file = new File([blob], dateiname, { type: mime })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: dateiname })
      return
    } catch {
      // Abbruch durch Nutzer -> auf Download zurückfallen
    }
  }
  const url = URL.createObjectURL(blob)
  const a = el('a', { href: url, download: dateiname })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function dataView({ go }) {
  const main = el('main')
  const status = el('.muted', { style: 'margin-top:10px' })

  const fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' })
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    const text = await file.text()
    const modus = confirm('Importierte Daten mit vorhandenen ZUSAMMENFÜHREN?\n\nOK = zusammenführen · Abbrechen = komplett ersetzen') ? 'merge' : 'replace'
    if (modus === 'replace' && !confirm('Wirklich ALLE vorhandenen Daten ersetzen?')) return
    try {
      importJSON(text, modus)
      status.textContent = `Import erfolgreich (${modus === 'merge' ? 'zusammengeführt' : 'ersetzt'}).`
    } catch (e) {
      status.textContent = `Import fehlgeschlagen: ${e.message}`
    }
    fileInput.value = ''
  })

  main.append(
    el('.card', {}, [
      el('h2', { text: 'Datensicherung' }),
      el('.hinweis', { text: 'Alle Daten liegen nur auf diesem Gerät. Exportiere regelmäßig und sichere die Datei z. B. in iCloud Drive.' }),
    ]),
    el('.card.stack', {}, [
      el('h2', { text: 'Exportieren' }),
      el('button.primary', { text: '⬆︎ Alles als JSON sichern', onClick: () => speichereDatei(exportJSON(), `rochushof-caddie-${datumStempel()}.json`, 'application/json') }),
      el('button.ghost', { text: '⬆︎ Runden als CSV (Excel)', onClick: () => speichereDatei(toCSV(getRounds()), `rochushof-runden-${datumStempel()}.csv`, 'text/csv') }),
    ]),
    el('.card.stack', {}, [
      el('h2', { text: 'Importieren' }),
      el('.muted', { text: 'JSON-Sicherung wieder einlesen. Du wirst gefragt, ob zusammengeführt oder ersetzt wird.' }),
      el('button.ghost', { text: '⬇︎ JSON-Datei wählen', onClick: () => fileInput.click() }),
      fileInput,
      status,
    ]),
    el('button.ghost', { text: 'Zur Startseite', onClick: () => go('#/') }),
  )

  return { title: 'Daten', back: '#/', body: main }
}
