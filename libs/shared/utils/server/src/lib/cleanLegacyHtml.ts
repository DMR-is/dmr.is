import render from 'dom-serializer'
import { ChildNode, Document, Element, Node } from 'domhandler'
import { findAll, findOne, getText } from 'domutils'
import { parseDocument } from 'htmlparser2'
import sanitizeHtml from 'sanitize-html'

function despaceIfSpacedOut(input: string): string {
  const s = input ?? ''

  // do we have long runs of "nonspace space nonspace"?
  if (!/(\S\s){10,}\S/.test(s)) return s

  const PLACEHOLDER = '\u0007' // unlikely char
  return (
    s
      // 1) Protect original word boundaries
      .replace(/ {2,}/g, PLACEHOLDER)
      // 2) Remove all remaining (single) spaces — these are the injected inter-letter spaces
      .replace(/ /g, '')
      // 3) Restore single spaces at original word boundaries
      .replace(new RegExp(PLACEHOLDER, 'g'), ' ')
  )
}

const isElement = (n: Node): n is Element => (n as Element).type === 'tag'
const tag = (n: Node) => (isElement(n) ? n.name.toLowerCase() : '')

// Render innerHTML of a node list
function renderChildren(children: ChildNode[]): string {
  return children.map((n) => render(n as any)).join('')
}
// Render whole document (its children only)
function renderDocument(doc: Document): string {
  return renderChildren(doc.children)
}

// Remove a node but keep its children (unwrap)
function unwrapTagInPlace(el: Element) {
  const parent = el.parent as Element | Document | null
  if (!parent) return
  const i = parent.children.indexOf(el)
  if (i < 0) return
  const kids = el.children
  for (const k of kids) (k as any).parent = parent
  parent.children.splice(i, 1, ...kids)
}

// Decode/normalize style values (strip HTML-encoded quotes & wrapping quotes)
function normalizeStyle(val?: string): string {
  if (!val) return ''
  let s = val.replace(/&quot;|&#34;/g, '"').trim()

  if (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))
  ) {
    s = s.slice(1, -1).trim()
  }

  s = s.replace(/\s*;\s*/g, '; ').replace(/;+\s*$/g, '')
  return s
}
// Ensure text-align:center in a style string
function ensureTextAlignCenter(style?: string): string {
  const s = normalizeStyle(style)
  if (/(^|;)\s*text-align\s*:/i.test(s)) return s
  return s ? `${s}; text-align:center` : 'text-align:center'
}

// Detect if an element (or its subtree) contains any block-level element
const BLOCKS = new Set([
  'div',
  'p',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'ul',
  'ol',
  'li',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
])
function hasBlockDescendant(n: Element): boolean {
  return !!findOne((x) => isElement(x) && BLOCKS.has(tag(x)), [n])
}

// Return which ad class is present up to a stop ancestor
type AdKind = 'advertSubSerial' | 'advertText' | null
function adClassUpTo(node: Node, stopAt: Element): AdKind {
  let p: any = node
  while (p && p !== stopAt) {
    if (isElement(p) && p.attribs?.class) {
      if (/\badvertSubSerial\b/.test(p.attribs.class)) return 'advertSubSerial'
    }
    p = p.parent
  }
  return null
}

// ---------- body extraction ----------
function extractBodyInnerDom(html: string): { inner: string | null } {
  const doc = parseDocument(html ?? '')
  const body = findOne(
    (n) => isElement(n) && tag(n) === 'body',
    [doc],
  ) as Element | null
  if (!body) return { inner: null }
  return { inner: renderChildren(body.children) }
}

// ---------- root-only table rewrite (runs only when there is NO <body>) ----------
function rewriteRootTablesOnly(html: string): string {
  const doc: Document = parseDocument(html ?? '')

  // 1) Remove all <meta> anywhere
  const metas = findAll(
    (n) => isElement(n) && tag(n) === 'meta',
    [doc],
  ) as Element[]
  metas.forEach(unwrapTagInPlace)

  // 2) For each top-level <table>, flatten it
  for (const child of [...doc.children]) {
    if (!(isElement(child) && tag(child) === 'table')) continue

    const table = child

    // Collect cells whose NEAREST ancestor table is THIS root table
    const cells = findAll(
      (n) => {
        if (!(isElement(n) && (tag(n) === 'td' || tag(n) === 'th')))
          return false
        // nearest ancestor table
        let p: any = n.parent
        while (p && !(isElement(p) && tag(p) === 'table')) p = p.parent
        return p === table
      },
      [table],
    ) as Element[]

    // Build replacement nodes
    const replacements: Element[] = []
    for (const cell of cells) {
      const ad = adClassUpTo(cell, table) // which ad kind (if any)
      // Decide wrapper tag:
      let wrapperTag: 'p' | 'div' = 'div'
      if (ad === 'advertSubSerial' && !hasBlockDescendant(cell)) {
        wrapperTag = 'p'
      }

      // Create wrapper and move children
      const el = new Element(wrapperTag, { ...cell.attribs })
      el.children = cell.children
      for (const ch of el.children) (ch as any).parent = el

      // Style & class cleanup for ads
      if (ad) {
        el.attribs = el.attribs || {}
        el.attribs.style = ensureTextAlignCenter(el.attribs.style)
        if (el.attribs.class) {
          const kept = el.attribs.class
            .split(/\s+/)
            .filter((c) => c && !/\b(advertSubSerial)\b/.test(c))
            .join(' ')
          if (kept) el.attribs.class = kept
          else delete el.attribs.class
        }
      }

      // Drop empty ad wrappers (avoid empty <p> at bottom)
      const text = getText(el).replace(/\s+/g, '')
      const hasImgOrBr = !!findOne(
        (n) => isElement(n) && (tag(n) === 'img' || tag(n) === 'br'),
        [el],
      )
      if (ad && !text && !hasImgOrBr) {
        continue // skip pushing an empty ad node
      }

      replacements.push(el)
    }

    // Replace this root table with the replacements
    const parent = table.parent as Document
    const idx = parent.children.indexOf(table)
    if (idx >= 0) {
      replacements.forEach((d) => ((d as any).parent = parent))
      parent.children.splice(idx, 1, ...replacements)
    }
  }

  return renderDocument(doc)
}

// ---------- sanitize-html config ----------
const baseOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'div',
    'p',
    'span',
    'br',
    'hr',
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'sub',
    'sup',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
  ],
  disallowedTagsMode: 'discard',
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'id', 'class', 'title'],
    p: ['style', 'align', 'id', 'class', 'title'],
    div: ['style', 'align', 'id', 'class', 'title'],
    table: ['style', 'align', 'id', 'class', 'title'],
    tr: ['style', 'align', 'id', 'class', 'title'],
    td: ['style', 'align', 'id', 'class', 'title', 'rowspan', 'colspan'],
    th: ['style', 'align', 'id', 'class', 'title', 'rowspan', 'colspan'],
    ul: ['style', 'id', 'class', 'title'],
    ol: ['start', 'type', 'style', 'id', 'class', 'title'],
    '*': ['id', 'class', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  allowedStyles: {
    p: { 'text-align': [/^(left|right|center|justify)$/i] },
    div: { 'text-align': [/^(left|right|center|justify)$/i] },
    ol: {
      'list-style-type': [
        /^(decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)$/i,
      ],
    },
    ul: {
      'list-style-type': [/^(disc|circle|square)$/i],
    },
  },
  transformTags: {
    '*': (tagName, attribs) => {
      const cls = attribs.class || ''

      const allowStyleOn = new Set(['p', 'table', 'tr', 'td', 'th', 'ol', 'ul'])
      if (!allowStyleOn.has(tagName)) delete attribs.style

      if (attribs.style) {
        attribs.style = normalizeStyle(attribs.style)
      }

      if (/\badvertSubSerial\b/.test(cls)) {
        const { class: _drop, ...rest } = attribs
        return {
          tagName: 'p',
          attribs: { ...rest, style: ensureTextAlignCenter(rest.style) },
        }
      }

      return { tagName, attribs }
    },
    body: 'div',
    meta: '',
  },
}

const removeStyleAttributes = (input: string) => {
  // Remove all style="..." attributes using regex
  return input.replace(/\sstyle=("|').*?("|')/gi, '')
}

export const simpleSanitize = (html: string) => {
  return sanitizeHtml(html, baseOptions)
}

export function cleanLegacyHtml(input: string): string {
  const src = despaceIfSpacedOut(input ?? '')

  // If there's a real <body> ANYWHERE, use only body innerHTML, sanitize, wrap in <div>
  const { inner } = extractBodyInnerDom(src)
  if (inner !== null) {
    const cleaned = sanitizeHtml(inner, baseOptions)
    return cleaned.replace(/\r?\n/g, '') // strip newlines
  }

  // Otherwise, rewrite ONLY root-level tables (nested tables remain), then sanitize
  const pre = rewriteRootTablesOnly(src)
  const cleaned = sanitizeHtml(pre, baseOptions)
  return cleaned.replace(/\r?\n/g, '') // strip newlines
}

export function cleanLegalGazetteLegacyHtml(html: string): string {
  const src = sanitizeHtml(html, baseOptions)
  const cleaned = removeStyleAttributes(src)
  return cleaned
}

export default cleanLegacyHtml
