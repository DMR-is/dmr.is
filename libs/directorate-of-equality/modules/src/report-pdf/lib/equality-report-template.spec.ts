import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { buildEqualityReportHtml } from './equality-report-template'

/**
 * `content` is the only value in this document interpolated as markup rather
 * than escaped — it is the rich text the company submitted, and nothing on the
 * write path sanitises it (`ApiHTML` only base64-decodes). It is then rendered
 * by `--no-sandbox` Chromium inside the API container, so these tests pin the
 * sanitising that keeps a submitted plan from becoming code.
 */
function makeReport(content: string | null): ReportDetailDto {
  return ({
    id: 'r1',
    company: { name: 'Test ehf.', nationalId: '111111-1111' },
    equalityReport: {
      identifier: 'JA-1',
      content,
      approvedAt: null,
      validUntil: null,
      correctionDeadline: null,
    },
  } as unknown) as ReportDetailDto
}

describe('buildEqualityReportHtml', () => {
  it('keeps the formatting a rich-text plan actually uses', () => {
    const html = buildEqualityReportHtml(
      makeReport(
        '<h2>Markmið</h2><p><strong>Jöfn laun</strong></p><ul><li>Úttekt</li></ul>',
      ),
    )

    expect(html).toContain('<h2>Markmið</h2>')
    expect(html).toContain('<strong>Jöfn laun</strong>')
    expect(html).toContain('<li>Úttekt</li>')
  })

  it('strips a script element from the submitted plan', () => {
    const html = buildEqualityReportHtml(
      makeReport(
        '<p>Áætlun</p><script>fetch("http://169.254.169.254/")</script>',
      ),
    )

    expect(html).toContain('<p>Áætlun</p>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('169.254.169.254')
  })

  it('strips event handlers, which need no script element to run', () => {
    const html = buildEqualityReportHtml(
      makeReport('<img src="x" onerror="fetch(\'http://internal/\')" />'),
    )

    expect(html).not.toContain('onerror')
    expect(html).not.toContain('internal')
  })

  /*
   * The forgery half of the problem, and the reason disabling JavaScript in the
   * renderer is not on its own sufficient: a `<style>` block needs no scripting
   * to hide or overwrite the Yfirlit metadata of the document being archived.
   */
  it('strips a style element that could rewrite the document around it', () => {
    const html = buildEqualityReportHtml(
      makeReport('<style>.field__value { display: none }</style><p>Áætlun</p>'),
    )

    expect(html).not.toContain('<style')
    expect(html).not.toContain('display: none')
  })

  it('renders the empty note when the plan sanitises away entirely', () => {
    const html = buildEqualityReportHtml(
      makeReport('<script>alert(1)</script>'),
    )

    expect(html).toContain('Ekkert efni skráð fyrir jafnréttisáætlun.')
    expect(html).not.toContain('rich-content')
  })

  it('renders the empty note when there is no content at all', () => {
    const html = buildEqualityReportHtml(makeReport(null))

    expect(html).toContain('Ekkert efni skráð fyrir jafnréttisáætlun.')
  })

  it('escapes the company name, which is not markup', () => {
    const report = makeReport('<p>Áætlun</p>')
    const html = buildEqualityReportHtml(({
      ...report,
      company: {
        ...report.company,
        name: 'Test <script>alert(1)</script> ehf.',
      },
    } as unknown) as ReportDetailDto)

    expect(html).not.toContain('<script')
    expect(html).toContain('&lt;script&gt;')
  })
})
