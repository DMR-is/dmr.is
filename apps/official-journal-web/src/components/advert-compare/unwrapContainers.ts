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

const isContainer = (el: Element) =>
  el.tagName === 'DIV' &&
  Array.from(el.children).some((child) => BLOCK_TAGS.has(child.tagName))

// The differ pairs top-level blocks, so a published document wrapped in a
// container <div> reads as one block against the Meginmál's paragraphs and
// the whole text shows as deleted and re-inserted. Lift the children of any
// top-level <div> that holds block content, until only real blocks remain.
//
// This flattens every such wrapper, including signature / signature__content,
// so their classes are gone from the diff output and a paragraph moved into
// or out of one does not show as a change. Fine for a text comparison.
export const unwrapContainers = (html: string): string => {
  const root = document.createElement('div')
  root.innerHTML = html
  let container = Array.from(root.children).find(isContainer)
  while (container) {
    container.replaceWith(...Array.from(container.childNodes))
    container = Array.from(root.children).find(isContainer)
  }
  return root.innerHTML
}
