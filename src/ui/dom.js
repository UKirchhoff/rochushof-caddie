// Winzige DOM-Helfer, damit die Views ohne Framework auskommen.

/**
 * Erzeugt ein Element.
 * @param {string} tag  z.B. 'div', 'button.primary', 'span#id'
 * @param {object} [attrs] Attribute/Eigenschaften (class, onClick, text, html, ...)
 * @param {(Node|string)[]} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const m = tag.match(/^([a-z0-9]+)?(?:#([\w-]+))?((?:\.[\w-]+)*)$/i)
  const [, name = 'div', id, classChain = ''] = m || []
  const node = document.createElement(name)
  if (id) node.id = id
  if (classChain) node.className = classChain.split('.').filter(Boolean).join(' ')

  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ')
    else if (k === 'text') node.textContent = v
    else if (k === 'html') node.innerHTML = v
    else if (k === 'dataset') Object.assign(node.dataset, v)
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (k in node && k !== 'list') {
      try {
        node[k] = v
      } catch {
        node.setAttribute(k, v)
      }
    } else {
      node.setAttribute(k, v)
    }
  }

  for (const c of [].concat(children)) {
    if (c == null || c === false) continue
    node.append(c.nodeType ? c : document.createTextNode(String(c)))
  }
  return node
}

/** Leert einen Container. */
export function clear(node) {
  node.replaceChildren()
  return node
}

/** Setzt den Inhalt eines Containers auf ein einzelnes Kind. */
export function mount(container, child) {
  clear(container)
  container.append(child)
  return container
}
