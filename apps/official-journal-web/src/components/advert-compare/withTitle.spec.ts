/** @jest-environment jsdom */
import getStructuredDiff from '@dmr.is/regulations-tools/structuredDiff-browser'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { normalizeForDiff } from './normalizeForDiff'
import { withTitle } from './withTitle'

const diffMarks = (
  oldTitle: string,
  oldHtml: string,
  newTitle: string,
  newHtml: string,
) => {
  const { diff } = getStructuredDiff(
    withTitle(oldTitle, normalizeForDiff(oldHtml)) as HTMLText,
    withTitle(newTitle, normalizeForDiff(newHtml)) as HTMLText,
  )
  return (diff.match(/<(ins|del)\b/g) ?? []).length
}

const body = '<p>1. gr.</p><p>Reglugerðin öðlast þegar gildi.</p>'
const fourth = 'REGLUGERÐ um fjórðu breytingu á reglugerð nr. 1237/2023'
const fifth = 'REGLUGERÐ um fimmtu breytingu á reglugerð nr. 1237/2023'

describe('withTitle', () => {
  it('puts the title before the body as its own block', () => {
    expect(withTitle('Heiti', '<p>Texti.</p>')).toBe(
      '<h2 class="compare-title">Heiti</h2><p>Texti.</p>',
    )
  })

  it('escapes markup in the title', () => {
    expect(withTitle('A < B & C > D', '')).toBe(
      '<h2 class="compare-title">A &lt; B &amp; C &gt; D</h2>',
    )
  })

  it('collapses line breaks and non-breaking spaces', () => {
    expect(withTitle('  um\nfjórðu\u00A0 breytingu ', '')).toBe(
      '<h2 class="compare-title">um fjórðu breytingu</h2>',
    )
  })

  it('keeps an empty title as a block', () => {
    expect(withTitle('', '<p>Texti.</p>')).toBe(
      '<h2 class="compare-title"></h2><p>Texti.</p>',
    )
  })

  it('shows no change when title and body match', () => {
    expect(diffMarks(fourth, body, fourth, body)).toBe(0)
  })

  it('shows a change in the title when the body matches', () => {
    expect(diffMarks(fourth, body, fifth, body)).toBeGreaterThan(0)
  })
})
