/** @jest-environment jsdom */
import getStructuredDiff from '@dmr.is/regulations-tools/structuredDiff-browser'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { normalizeForDiff } from './normalizeForDiff'

// What the editor sees: the number of marks the differ puts in the
// comparison of the two normalised texts. Text changes come as ins/del;
// a block with no text, such as an <hr>, is marked on the element itself.
const diffMarks = (oldHtml: string, newHtml: string) => {
  const { diff } = getStructuredDiff(
    normalizeForDiff(oldHtml) as HTMLText,
    normalizeForDiff(newHtml) as HTMLText,
  )
  return (diff.match(/<(ins|del)\b|<hr data-diff="(insert|delete)"/g) ?? [])
    .length
}

const bare = '<p>Fyrsta málsgrein.</p><p align="center">Önnur.</p>'

describe('normalizeForDiff', () => {
  it('leaves clean paragraphs unchanged', () => {
    expect(normalizeForDiff(bare)).toBe(bare)
  })

  it('turns a wrapped document into the bare one', () => {
    expect(normalizeForDiff(`<div class="advert">${bare}</div>`)).toBe(bare)
  })

  it('flattens nested containers fully', () => {
    expect(
      normalizeForDiff(
        `<div><div class="signature"><div class="signature__content">${bare}</div></div></div>`,
      ),
    ).toBe(bare)
  })

  it('keeps the text of mixed inline and block content', () => {
    expect(
      normalizeForDiff('<div>Inngangur <em>texti</em><p>Málsgrein.</p></div>'),
    ).toBe('Inngangur <em>texti</em><p>Málsgrein.</p>')
  })

  it('turns a div holding only inline content into a paragraph', () => {
    expect(normalizeForDiff('<div align="center">Aðeins texti</div>')).toBe(
      '<p align="center">Aðeins texti</p>',
    )
  })

  it('uses strong and em for b and i', () => {
    expect(normalizeForDiff('<p><b>Feitt</b> og <i>skáletrað</i></p>')).toBe(
      '<p><strong>Feitt</strong> og <em>skáletrað</em></p>',
    )
  })

  it('moves a line break out of the end or start of inline tags', () => {
    expect(
      normalizeForDiff('<p><em><strong>Fyrirsögn.<br></strong></em>Texti.</p>'),
    ).toBe('<p><em><strong>Fyrirsögn.</strong></em><br>Texti.</p>')
    expect(normalizeForDiff('<p>Texti.<em><br>Skáletrað</em></p>')).toBe(
      '<p>Texti.<br><em>Skáletrað</em></p>',
    )
  })

  it('lowercases class names', () => {
    expect(normalizeForDiff('<p class="FHUndirskr">Nafn</p>')).toBe(
      '<p class="fhundirskr">Nafn</p>',
    )
  })

  it('drops empty blocks and line breaks between blocks', () => {
    expect(
      normalizeForDiff(
        '<div></div><br><p>Fyrsta.</p><p>\u00A0</p><br><p>Önnur.</p><div>   </div>',
      ),
    ).toBe('<p>Fyrsta.</p><p>Önnur.</p>')
  })

  it('keeps line breaks between loose inline text', () => {
    expect(normalizeForDiff('Lína eitt<br>Lína tvö')).toBe(
      'Lína eitt<br>Lína tvö',
    )
  })

  it('normalises non-breaking spaces and strips invisible characters', () => {
    expect(
      normalizeForDiff('<p>samþykkt\u00A0eftir\u00ADfarandi\u200B</p>'),
    ).toBe('<p>samþykkt eftirfarandi</p>')
  })

  it('brings a legacy published advert to the shape of the editor output', () => {
    const published =
      '<div class="advertTD"></div><div class="advertTD"><br /><p style="text-align:justify">Í samræmi við skipulagslög.</p><p style="text-align:justify">\u00A0</p><p style="text-align:justify"><em>Deiliskipulagsbreyting.<br /></em>Um er að ræða breytingu.</p><p class="fhundirskr" style="text-align:center">Skipulagsfulltrúi,</p><br /></div><div align="center"><b>B deild - Útgáfud.: 5. október 2023</b></div><div>      </div>'
    const editor =
      '<p>Í samræmi við skipulagslög.</p><p><em>Deiliskipulagsbreyting.</em><br />Um er að ræða breytingu.</p><p class="FHUndirskr" style="text-align: center;">Skipulagsfulltrúi,</p><p style="text-align: center;"><strong>B deild - Útgáfud.: 5. október 2023</strong></p>'

    expect(diffMarks(published, editor)).toBe(0)
  })

  it('keeps an hr, so removing one shows as a change', () => {
    expect(normalizeForDiff('<p>A</p><hr><p>B</p>')).toBe(
      '<p>A</p><hr><p>B</p>',
    )
    expect(
      diffMarks('<p>A</p><hr><p>B</p>', '<p>A</p><p>B</p>'),
    ).toBeGreaterThan(0)
  })

  it('drops a line break ending a block, and keeps a leading one', () => {
    expect(normalizeForDiff('<p>Texti.<br></p>')).toBe('<p>Texti.</p>')
    expect(normalizeForDiff('<p><strong>Feitt<br></strong></p>')).toBe(
      '<p><strong>Feitt</strong></p>',
    )
    expect(normalizeForDiff('<p><br>Texti.</p>')).toBe('<p><br>Texti.</p>')
    expect(diffMarks('<p>Texti.<br></p>', '<p>Texti.</p>')).toBe(0)
  })

  it('moves a line break out of an inline tag past surrounding whitespace', () => {
    expect(normalizeForDiff('<p><em>Fyrirsögn.<br>\n</em>Texti.</p>')).toBe(
      '<p><em>Fyrirsögn.\n</em><br>Texti.</p>',
    )
  })

  it('is idempotent for blocks nested inside inline tags', () => {
    const once = normalizeForDiff('<div><span><p>Málsgrein.</p></span></div>')
    expect(normalizeForDiff(once)).toBe(once)
  })
})
