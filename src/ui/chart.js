// Schlichter Linien-Graph als Inline-SVG (keine Bibliothek, offline-tauglich).

/**
 * @param {number[]} werte  Y-Werte in chronologischer Reihenfolge
 * @param {object} [opt]
 * @param {string} [opt.farbe]
 * @param {boolean} [opt.invertiert] true = kleinere Werte weiter oben (z.B. Handicap)
 * @param {(v:number)=>string} [opt.format]
 * @returns {SVGElement}
 */
export function lineChart(werte, opt = {}) {
  const { farbe = '#0b6e33', invertiert = false, format = (v) => String(v) } = opt
  const W = 520
  const H = 200
  const pad = { l: 40, r: 12, t: 14, b: 24 }
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  svg.setAttribute('class', 'chart')
  svg.setAttribute('role', 'img')

  const gueltig = werte.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (gueltig.length === 0) {
    const t = document.createElementNS(svgNS, 'text')
    t.setAttribute('x', W / 2)
    t.setAttribute('y', H / 2)
    t.setAttribute('text-anchor', 'middle')
    t.setAttribute('fill', '#5b6b62')
    t.textContent = 'Noch keine Daten'
    svg.append(t)
    return svg
  }

  let min = Math.min(...gueltig)
  let max = Math.max(...gueltig)
  if (min === max) {
    min -= 1
    max += 1
  }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const n = werte.length
  const x = (i) => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v) => {
    const t = (v - min) / (max - min)
    const tt = invertiert ? t : 1 - t
    return pad.t + tt * innerH
  }

  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(svgNS, tag)
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
    return e
  }

  // Achsen / Raster (min, mitte, max)
  for (const v of [min, (min + max) / 2, max]) {
    svg.append(svgEl('line', { x1: pad.l, y1: y(v), x2: W - pad.r, y2: y(v), stroke: '#e2ebe5', 'stroke-width': 1 }))
    const label = svgEl('text', { x: pad.l - 6, y: y(v) + 4, 'text-anchor': 'end', fill: '#5b6b62', 'font-size': 11 })
    label.textContent = format(Math.round(v * 10) / 10)
    svg.append(label)
  }

  // Linie
  const punkte = werte.map((v, i) => (typeof v === 'number' ? `${x(i)},${y(v)}` : null)).filter(Boolean)
  svg.append(svgEl('polyline', { points: punkte.join(' '), fill: 'none', stroke: farbe, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))

  // Punkte
  werte.forEach((v, i) => {
    if (typeof v !== 'number') return
    svg.append(svgEl('circle', { cx: x(i), cy: y(v), r: 4, fill: farbe }))
  })

  return svg
}
