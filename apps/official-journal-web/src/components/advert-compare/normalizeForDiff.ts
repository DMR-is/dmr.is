const BLOCK_TAGS = new Set([
  'DIV',
  'P',
  'TABLE',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'PRE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
])

const INLINE_TAGS = new Set([
  'A',
  'B',
  'EM',
  'I',
  'S',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'U',
])

// Old Word exports scatter these through words; they render as nothing, but
// to the differ the word is a different word.
const INVISIBLE_CHARS = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g

const hasBlockChild = (el: Element) =>
  Array.from(el.children).some((child) => BLOCK_TAGS.has(child.tagName))

const isEmpty = (el: Element) =>
  !el.textContent?.trim() && !el.querySelector('img, table, hr')

const rename = (el: Element, tagName: string) => {
  const next = el.ownerDocument.createElement(tagName)
  Array.from(el.attributes).forEach((attr) =>
    next.setAttribute(attr.name, attr.value),
  )
  next.append(...Array.from(el.childNodes))
  el.replaceWith(next)
  return next
}

const isSkippable = (node: ChildNode | null) =>
  node?.nodeType === Node.TEXT_NODE && !node.textContent?.trim()

// The differ pairs top-level blocks and compares their markup as well as
// their text, so it reports differences an editor cannot see. Published
// adverts carried over from the old system differ from the editor's output in
// exactly those ways, and without this an identical advert shows paragraphs
// as removed and re-added. Both sides go through the same steps, so only real
// differences in text or inline formatting remain.
//
// Steps:
// - text: non-breaking spaces become spaces, invisible characters go
// - <b> and <i> become <strong> and <em>
// - a top-level <div> holding blocks is unwrapped, until none remain. This
//   includes signature / signature__content, so their classes are gone from
//   the diff output and a paragraph moved into or out of one does not show
// - a top-level <div> holding only inline content becomes a <p>
// - a <br> at the start or end of an inline element moves outside it
// - class names are lowercased; legacy adverts carry Word's style names in
//   whatever case the export used
// - empty top-level blocks and <br>s between blocks are dropped; they are
//   spacing, not content
export const normalizeForDiff = (html: string): string => {
  const root = document.createElement('div')
  root.innerHTML = html

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    node.textContent = (node.textContent ?? '')
      .replace(/\u00A0/g, ' ')
      .replace(INVISIBLE_CHARS, '')
  }

  root.querySelectorAll('b').forEach((el) => rename(el, 'strong'))
  root.querySelectorAll('i').forEach((el) => rename(el, 'em'))

  let container = Array.from(root.children).find(
    (el) => el.tagName === 'DIV' && hasBlockChild(el),
  )
  while (container) {
    container.replaceWith(...Array.from(container.childNodes))
    container = Array.from(root.children).find(
      (el) => el.tagName === 'DIV' && hasBlockChild(el),
    )
  }

  Array.from(root.children)
    .filter((el) => el.tagName === 'DIV')
    .forEach((el) => rename(el, 'p'))

  // Deepest first, so a <br> inside nested inline tags travels all the way out.
  Array.from(root.querySelectorAll('br'))
    .reverse()
    .forEach((br) => {
      let parent = br.parentElement
      while (parent && parent !== root && INLINE_TAGS.has(parent.tagName)) {
        if (br === parent.lastChild) parent.after(br)
        else if (br === parent.firstChild) parent.before(br)
        else break
        parent = br.parentElement
      }
    })

  root.querySelectorAll('[class]').forEach((el) => {
    el.setAttribute('class', (el.getAttribute('class') ?? '').toLowerCase())
  })

  Array.from(root.children).forEach((el) => {
    if (BLOCK_TAGS.has(el.tagName) && isEmpty(el)) el.remove()
  })
  Array.from(root.querySelectorAll(':scope > br')).forEach((br) => {
    let prev = br.previousSibling
    while (prev && isSkippable(prev)) prev = prev.previousSibling
    let next = br.nextSibling
    while (next && isSkippable(next)) next = next.nextSibling
    const besideBlock = (node: ChildNode | null) =>
      !node ||
      (node.nodeType === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has((node as Element).tagName))
    if (besideBlock(prev) || besideBlock(next)) br.remove()
  })

  return root.innerHTML
}
