// Private module of regulations-tools (no exports map; pinned version), as in
// replaceImageUrls.ts. Check it still exists when bumping the package.
import { asDiv } from '@dmr.is/regulations-tools/_cleanup/serverDOM'

import { HTMLText, PlainText } from '../routes/types'
import { getHtmlDiff, getTextContentDiff } from './diff'

const html = (s: string) => s as HTMLText

const article = (...paragraphs: Array<string>) =>
  html(
    '<h3 class="article__title">1. gr. <em class="article__name">Gildissvið.</em></h3>' +
      paragraphs.map((p) => `<p>${p}</p>`).join(''),
  )

describe('getHtmlDiff', () => {
  it('returns the text unchanged when nothing changed', () => {
    const text = article('Reglugerð þessi gildir um alla.')
    expect(getHtmlDiff(text, text)).toBe(text)
  })

  it('marks a new paragraph as one insertion, leaving its neighbours alone', () => {
    const older = article(
      'Reglugerð þessi gildir um skoðun ökutækja.',
      'Ráðherra setur nánari reglur um skoðun ökutækja.',
    )
    const newer = article(
      'Reglugerð þessi gildir um skoðun ökutækja.',
      'Reglugerð þessi gildir einnig um skoðun eftirvagna.',
      'Ráðherra setur nánari reglur um skoðun ökutækja.',
    )
    const div = asDiv(getHtmlDiff(older, newer))
    const paragraphs = Array.from(div.querySelectorAll('p')).map((p) => ({
      diff: p.getAttribute('data-diff'),
      marked: !!p.querySelector('ins, del'),
    }))

    expect(paragraphs).toEqual([
      { diff: null, marked: false },
      { diff: 'insert', marked: true },
      { diff: null, marked: false },
    ])
    expect(
      div.querySelector('p[data-diff="insert"] ins.diffins')?.textContent,
    ).toBe('Reglugerð þessi gildir einnig um skoðun eftirvagna.')
  })

  it('leaves no empty marks when a table row is added', () => {
    const table = (rows: string) =>
      html(
        `<h3 class="article__title">1. gr.</h3>\n<table>\n<tbody>\n${rows}</tbody>\n</table>\n`,
      )
    const row = (a: string, b: string) =>
      `<tr>\n<td>${a}</td>\n<td>${b}</td>\n</tr>\n`
    const diff = getHtmlDiff(
      table(row('A', '1')),
      table(row('A', '1') + row('B', '2')),
    )

    expect(diff).not.toMatch(/<(ins|del) [^>]+>\s*<\/\1>/)
    expect(diff).toContain('<ins class="diffins">B</ins>')
  })

  it('marks everything inserted when there is no earlier text', () => {
    const div = asDiv(getHtmlDiff(html(''), article('Ný málsgrein.')))

    expect(div.querySelector('del')).toBeNull()
    expect(div.querySelector('p ins.diffins')?.textContent).toBe(
      'Ný málsgrein.',
    )
  })
})

describe('getTextContentDiff', () => {
  it('escapes > in plain text', () => {
    const title = 'Reglugerð um mörk > 3,5 tonn' as PlainText
    expect(getTextContentDiff(title, title)).toBe(
      'Reglugerð um mörk &gt; 3,5 tonn',
    )
  })

  it('word-diffs plain text', () => {
    const diff = getTextContentDiff(
      'Reglugerð um skoðun ökutækja' as PlainText,
      'Reglugerð um skoðun eftirvagna' as PlainText,
    )
    expect(diff).toContain('ökutækja</del>')
    expect(diff).toContain('eftirvagna</ins>')
  })

  it('returns the text unchanged when nothing changed', () => {
    const title = 'Reglugerð um skoðun ökutækja' as PlainText
    expect(getTextContentDiff(title, title)).toBe(title)
  })
})
