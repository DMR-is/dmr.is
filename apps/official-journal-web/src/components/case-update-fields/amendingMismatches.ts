/**
 * Possible mismatches between an amending regulation's text, which is
 * published as written, and the changes recorded on the base regulations,
 * which are applied as recorded whatever the text says. The OJOI
 * application warns the sender the same way.
 *
 * These are hints for the editor, not errors: prose can't be mapped back to
 * a diff reliably.
 */
import type {
  AmendedRegulation,
  AmendingMismatch,
} from '@dmr.is/regulations-tools/amendingMismatches-browser'
import type { HTMLText } from '@dmr.is/regulations-tools/types'

import { CaseAddition, RegulationImpact } from '../../gen/fetch'

/** `findAmendingMismatches` from the browser entry, loaded on demand. */
export type FindAmendingMismatches = (
  amendingHtml: HTMLText,
  regulations: ReadonlyArray<AmendedRegulation>,
) => Array<AmendingMismatch>

/** An amount or a date. `text` is as written where it was found. */
export type ValueMismatch =
  | {
      /** A base change brings it in, and the text never mentions it. */
      type: 'missingFromText'
      text: string
      /** "123/2020" */
      regulation: string
      /** The base section, "5. gr.", when known (old numbering). */
      section?: string
    }
  | {
      /** The text states it, and no change of a base regulation holds it. */
      type: 'notInChanges'
      text: string
      /** The amending text's own article, "1. gr.", when it has one. */
      section?: string
    }

export type WordingMismatches = {
  regulation: string
  section?: string
  /** Wording a base change brings in that the text never mentions. */
  texts: string[]
}

export type AmendingMismatches = {
  /** Amounts and dates, both ways: the likeliest slips. */
  values: ValueMismatch[]
  /** Wording, grouped by base regulation and section. */
  wording: WordingMismatches[]
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** "0123/2020" → "123/2020" */
const prettyName = (name: string) => name.replace(/^0+(?=\d)/, '')

export const getAmendingMismatches = (
  find: FindAmendingMismatches,
  {
    html,
    additions,
    impacts,
  }: {
    /** The case's text */
    html?: string
    /** The case's appendixes, published with the text */
    additions?: CaseAddition[]
    impacts: RegulationImpact[]
  },
): AmendingMismatches => {
  // A change recorded on a base regulation's text. The appendixes of an
  // impact carry no diff, so changes to them can't be compared.
  const regulations: AmendedRegulation[] = impacts
    .filter((i) => i.type === 'amend' && !i.dropped && i.diff)
    .map((i) => ({ name: prettyName(i.regulation), diff: i.diff as HTMLText }))

  const text = [
    html ?? '',
    ...[...(additions ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((a) => `<h2>${escapeHtml(a.title || 'Viðauki')}</h2>${a.html}`),
  ].join('') as HTMLText

  if (!regulations.length || !text.trim()) {
    return { values: [], wording: [] }
  }

  const values: ValueMismatch[] = []
  const wording: WordingMismatches[] = []
  for (const m of find(text, regulations)) {
    if (m.type === 'notInChanges') {
      values.push({ type: m.type, text: m.text, section: m.section })
    } else if (m.kind !== 'wording') {
      values.push({
        type: m.type,
        text: m.text,
        regulation: m.regulation ?? '',
        section: m.section,
      })
    } else {
      const regulation = m.regulation ?? ''
      const group = wording.find(
        (g) => g.regulation === regulation && g.section === m.section,
      )
      if (group) {
        group.texts.push(m.text)
      } else {
        wording.push({ regulation, section: m.section, texts: [m.text] })
      }
    }
  }
  // What the base brings in first, then what the text states
  values.sort(
    (a, b) =>
      Number(a.type === 'notInChanges') - Number(b.type === 'notInChanges'),
  )
  return { values, wording }
}
