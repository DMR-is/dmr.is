/**
 * Possible mismatches between an amending regulation's text, which is
 * published as written, and the changes recorded on the base regulations,
 * which are applied as recorded whatever the text says. The OJOI
 * application warns the sender the same way.
 *
 * These are hints for the editor, not errors: prose can't be mapped back to
 * a diff reliably.
 */
import type { AmendedRegulation } from '@dmr.is/regulations-tools/amendingMismatches-browser'
import type { HTMLText } from '@dmr.is/regulations-tools/types'

import { CaseAddition, RegulationImpact } from '../../gen/fetch'

/** `findAmendingMismatches` from the browser entry, loaded on demand. */
export type FindAmendingMismatches =
  typeof import('@dmr.is/regulations-tools/amendingMismatches-browser').default

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
  const amends = impacts.filter((i) => i.type === 'amend' && !i.dropped)
  // Each change recorded on a base regulation's text, and its appendixes.
  // An impact holds every appendix of the base regulation as the change
  // leaves them, with no diff, so each counts as changed throughout: amounts
  // in a replaced fee table are found, and nothing in an appendix is
  // reported as missing from the text. An amount in an appendix left as it
  // was can hide a slip in the text, and an amount the text quotes as
  // replaced in an appendix ("Í stað „kr. 1.200“ í viðauka …") is reported.
  // Diffing appendixes awaits a decision from the stakeholders. When
  // `RegulationAppendix` gets a diff, pass that here instead of the text,
  // as the OJOI application does.
  const regulations: AmendedRegulation[] = amends.flatMap((i) => {
    const name = prettyName(i.regulation)
    return [
      ...(i.diff ? [{ name, diff: i.diff as HTMLText }] : []),
      ...(i.appendixes ?? []).map((a) => ({ name, diff: a.text as HTMLText })),
    ]
  })
  // A change with no diff can't be compared, so the text may state
  // anything it brings in
  const unknownChanges = amends.some((i) => !i.diff)

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
      if (unknownChanges) continue
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
