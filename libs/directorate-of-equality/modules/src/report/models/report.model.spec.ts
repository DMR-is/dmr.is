import { ReportStatusEnum } from './report.enums'
import { ReportModel } from './report.model'

/**
 * `fromModelToEqualityReport` is the single choke point where the untrusted
 * `equality_report_content` column becomes a rendered field — the admin's
 * `HTMLEditor` (via `asDiv`, a raw `innerHTML` assignment) and the PDF renderer
 * both consume it. These pin the sanitising so a change to the projection
 * cannot quietly reopen that path.
 *
 * The model is a sequelize-typescript class; the projection only reads plain
 * fields off it, so a plain object stands in rather than a live instance.
 */
function makeModel(content: string | null): ReportModel {
  return {
    id: 'r1',
    identifier: 'JA-1',
    status: ReportStatusEnum.APPROVED,
    equalityReportContent: content,
    approvedAt: null,
    validUntil: null,
    correctionDeadline: null,
  } as unknown as ReportModel
}

describe('ReportModel.fromModelToEqualityReport', () => {
  it('keeps the formatting a rich-text plan actually uses', () => {
    const dto = ReportModel.fromModelToEqualityReport(
      makeModel('<h2>Markmið</h2><p><strong>Jöfn laun</strong></p><ul><li>Úttekt</li></ul>'),
    )

    expect(dto.content).toContain('<h2>Markmið</h2>')
    expect(dto.content).toContain('<strong>Jöfn laun</strong>')
    expect(dto.content).toContain('<li>Úttekt</li>')
  })

  /*
   * The vector the admin editor is exposed to. `<script>` inserted via
   * `innerHTML` does not execute, but an event handler on a parsed element
   * does — even while the node is still detached — so stripping attributes
   * matters at least as much as stripping tags.
   */
  it('strips event handlers, which fire from innerHTML even detached', () => {
    const dto = ReportModel.fromModelToEqualityReport(
      makeModel('<img src="x" onerror="fetch(\'/api/trpc/reportWorkflow.approve\')" />'),
    )

    expect(dto.content).not.toContain('onerror')
    expect(dto.content).not.toContain('/api/trpc')
  })

  it('strips a script element', () => {
    const dto = ReportModel.fromModelToEqualityReport(
      makeModel('<p>Áætlun</p><script>alert(1)</script>'),
    )

    expect(dto.content).toContain('<p>Áætlun</p>')
    expect(dto.content).not.toContain('<script')
  })

  it('strips a style element, which needs no scripting to forge the page', () => {
    const dto = ReportModel.fromModelToEqualityReport(
      makeModel('<style>.field__value{display:none}</style><p>Áætlun</p>'),
    )

    expect(dto.content).not.toContain('<style')
  })

  it('is idempotent, so sanitising again downstream costs nothing', () => {
    const once = ReportModel.fromModelToEqualityReport(
      makeModel('<p>Áætlun</p><img src="x" onerror="alert(1)" />'),
    ).content

    const twice = ReportModel.fromModelToEqualityReport(
      makeModel(once),
    ).content

    expect(twice).toBe(once)
  })

  it('passes null through rather than turning it into an empty string', () => {
    const dto = ReportModel.fromModelToEqualityReport(makeModel(null))

    expect(dto.content).toBeNull()
  })
})
