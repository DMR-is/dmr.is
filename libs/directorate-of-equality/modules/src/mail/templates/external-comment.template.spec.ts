import {
  ReportModel,
  ReportProviderEnum,
} from '../../report/models/report.model'
import { ReportCommentModel } from '../../report-comment/models/report-comment.model'
import {
  buildExternalCommentHtml,
  buildExternalCommentText,
} from './external-comment.template'

const LOG_IN = 'skráðu þig inn á umsókn'
const VIA_PROVIDER = 'þjónustuaðila fyrirtækisins'
const CONTACT_DOE = 'hafa samband við Jafnréttisstofu'

const reportOf = (
  providerType: ReportProviderEnum | null,
  providerId: string | null,
): ReportModel =>
  ({ id: 'report-1', providerType, providerId }) as unknown as ReportModel

const comment = (body = 'Vantar skýringar á tveimur röðum.'): ReportCommentModel =>
  ({ body }) as unknown as ReportCommentModel

/** Both renderings must agree; an integrator or employer may read either. */
const bothRenderings = (report: ReportModel): string[] => [
  buildExternalCommentHtml(report, comment()),
  buildExternalCommentText(report, comment()),
]

describe('external comment template', () => {
  describe('an island.is report', () => {
    const report = reportOf(ReportProviderEnum.ISLAND_IS, 'app-uuid-1')

    it('tells the reader to log in to the application', () => {
      for (const rendered of bothRenderings(report)) {
        expect(rendered).toContain(LOG_IN)
      }
    })

    it('links to the application', () => {
      for (const rendered of bothRenderings(report)) {
        expect(rendered).toContain(
          'https://island.is/umsoknir/jafnrettisstofa/app-uuid-1',
        )
      }
    })
  })

  describe('a partner-submitted report', () => {
    const report = reportOf(ReportProviderEnum.OTHER, '5501012130:2026-Q1')

    it('does NOT tell the reader to log in to an application that does not exist', () => {
      // The bug this fixes: the instruction used to be unconditional, so the
      // only channel a partner-submitted report has told the recipient to go
      // somewhere they cannot go, with no link.
      for (const rendered of bothRenderings(report)) {
        expect(rendered).not.toContain(LOG_IN)
      }
    })

    it('says the report came through a service provider, and who to contact', () => {
      for (const rendered of bothRenderings(report)) {
        expect(rendered).toContain(VIA_PROVIDER)
        expect(rendered).toContain(CONTACT_DOE)
      }
    })

    it('offers no island.is link', () => {
      for (const rendered of bothRenderings(report)) {
        expect(rendered).not.toContain('island.is/umsoknir')
      }
    })
  })

  describe('a report with no upstream application', () => {
    // SYSTEM is an admin's Excel import, and provider_type is nullable. Both
    // were already getting the log-in instruction before the partner channel
    // existed — this was a live bug, not only a future one.
    for (const [label, report] of [
      ['SYSTEM', reportOf(ReportProviderEnum.SYSTEM, null)],
      ['null provider', reportOf(null, null)],
      [
        'ISLAND_IS with no providerId',
        reportOf(ReportProviderEnum.ISLAND_IS, null),
      ],
    ] as Array<[string, ReportModel]>) {
      it(`points ${label} at Jafnréttisstofa rather than an application`, () => {
        for (const rendered of bothRenderings(report)) {
          expect(rendered).not.toContain(LOG_IN)
          expect(rendered).toContain(CONTACT_DOE)
        }
      })
    }
  })

  it('escapes the comment body in the HTML rendering', () => {
    // Reviewer-authored text reaching an employer's mail client.
    const rendered = buildExternalCommentHtml(
      reportOf(ReportProviderEnum.OTHER, 'x'),
      comment('<script>alert(1)</script>'),
    )

    expect(rendered).not.toContain('<script>')
    expect(rendered).toContain('&lt;script&gt;')
  })

  it('keeps the comment body readable in the text rendering', () => {
    const rendered = buildExternalCommentText(
      reportOf(ReportProviderEnum.OTHER, 'x'),
      comment('Fyrsta lína'),
    )

    expect(rendered).toContain('Fyrsta lína')
  })
})
