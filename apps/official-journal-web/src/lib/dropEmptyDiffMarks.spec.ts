/** @jest-environment jsdom */
import getStructuredDiff from '@dmr.is/regulations-tools/structuredDiff-browser'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { dropEmptyDiffMarks } from './dropEmptyDiffMarks'

const emptyMarks = /<(ins|del) [^>]+>\s*<\/\1>/g

describe('dropEmptyDiffMarks', () => {
  it('removes the empty marks a new table row leaves in the diff', () => {
    const table = (rows: string) =>
      `<h3 class="article__title">1. gr.</h3>\n<table>\n<tbody>\n${rows}</tbody>\n</table>\n`
    const row = (a: string, b: string) =>
      `<tr>\n<td>${a}</td>\n<td>${b}</td>\n</tr>\n`
    const { diff } = getStructuredDiff(
      table(row('A', '1')) as HTMLText,
      table(row('A', '1') + row('B', '2')) as HTMLText,
    )
    // Guards the premise: if the differ stops emitting them, this test can go.
    expect(diff.match(emptyMarks)).not.toBeNull()

    const cleaned = dropEmptyDiffMarks(diff)
    expect(cleaned.match(emptyMarks)).toBeNull()
    expect(cleaned).toContain('<ins class="diffins">B</ins>')
  })

  it('keeps marks with content, including a single space', () => {
    const html =
      '<p>a<ins class="diffins"> </ins>b<del class="diffdel">c</del></p>'
    expect(dropEmptyDiffMarks(html as HTMLText)).toBe(html)
  })
})
