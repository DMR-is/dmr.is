import { readFileSync } from 'fs'
import { join } from 'path'

import { EQUALITY_REPORT_TEMPLATE_BASE64 } from './template-data'
import { buildEqualityReportTemplateHtml } from './template-html'

/**
 * The docx and the HTML mirror are maintained by hand in two places: the
 * inlined base64 has to match the docx on disk, and the HTML has to carry the
 * same sections. Both drift silently, so both are asserted here.
 */
const SECTION_TITLES = [
  'Almenn ákvæði um launajafnrétti',
  'Laus störf, starfsþjálfun, endurmenntun og símenntun',
  'Samræming fjölskyldu- og atvinnulífs',
  'Kynbundið ofbeldi, kynbundin áreitni og kynferðisleg áreitni',
  'Eftirfylgni og endurskoðun',
]

describe('equality report template', () => {
  describe('EQUALITY_REPORT_TEMPLATE_BASE64', () => {
    it('decodes to the template.docx sitting next to it', () => {
      const onDisk = readFileSync(join(__dirname, 'template.docx'))

      expect(
        Buffer.from(EQUALITY_REPORT_TEMPLATE_BASE64, 'base64').equals(onDisk),
      ).toBe(true)
    })

    it('decodes to a zip container, as a docx must', () => {
      const buf = Buffer.from(EQUALITY_REPORT_TEMPLATE_BASE64, 'base64')

      expect(buf.subarray(0, 2).toString('ascii')).toBe('PK')
    })
  })

  describe('buildEqualityReportTemplateHtml', () => {
    const html = buildEqualityReportTemplateHtml()

    it.each(SECTION_TITLES)('renders the "%s" section', (title) => {
      expect(html).toContain(`<h2>${title}</h2>`)
    })

    it('renders the identification and validity fields', () => {
      expect(html).toContain('Heiti fyrirtækis/stofnunar:')
      expect(html).toContain('Gildistími:')
    })

    it('renders an empty intro box for the free-text narrative', () => {
      expect(html).toContain('<div class="intro-box"></div>')
    })

    it('renders one goal table per section, with blank action columns', () => {
      const tables = html.match(/<table>/g) ?? []
      expect(tables).toHaveLength(SECTION_TITLES.length)

      expect(html).toContain(
        '<th>Markmið</th><th>Aðgerð</th><th>Ábyrgð</th><th>Verklok/tímarammi</th>',
      )
      expect(html).toContain(
        '<td>Laus störf standi opin öllum óháð kyni.</td><td></td><td></td><td></td>',
      )
    })

    it('quotes the law rather than paraphrasing it', () => {
      expect(html).toContain(
        '<blockquote>„Konum, körlum og fólki með hlutlausa skráningu kyns',
      )
    })

    it('does not leak the template authors’ editorial notes', () => {
      expect(html).not.toMatch(/ÞESSI REITUR/i)
    })
  })
})
