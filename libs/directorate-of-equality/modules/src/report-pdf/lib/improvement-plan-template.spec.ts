import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.enums'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { ReportOutlierGroupDto } from '../../report-employee/dto/report-outlier-group.dto'
import {
  buildImprovementPlanHtml,
  ImprovementPlanGroup,
} from './improvement-plan-template'

describe('buildImprovementPlanHtml', () => {
  const report = {
    id: 'report-1',
    identifier: 'JLU-2026-0001',
    correctionDeadline: new Date('2026-05-21T00:00:00.000Z'),
    company: { name: 'Testing-hugbúnaður ehf.', nationalId: '000000-0000' },
  } as unknown as ReportDetailDto

  const member = (
    overrides: Partial<ReportEmployeeOutlierDto> = {},
  ): ReportEmployeeOutlierDto =>
    ({
      employeeOrdinal: 3,
      roleTitle: 'Sérfræðingur',
      gender: GenderEnum.FEMALE,
      score: 420,
      regularHourlyWage: 4750,
      expectedHourlyWage: 5000,
      deviationPercent: -5,
      payStatus: PayStatusEnum.UNDERPAID,
      contributionShare: 42.5,
      ...overrides,
    }) as ReportEmployeeOutlierDto

  const group = (
    overrides: Partial<ReportOutlierGroupDto> = {},
  ): ReportOutlierGroupDto =>
    ({
      id: 'group-1',
      reportId: 'report-1',
      name: 'Sérfræðingar í þróun',
      reason: 'Munur skýrist af starfsaldri',
      action: 'Laun verða jöfnuð við næstu endurskoðun',
      signatureName: 'Anna Jónsdóttir',
      signatureRole: 'Mannauðsstjóri',
      ...overrides,
    }) as ReportOutlierGroupDto

  const makeGroups = (
    ...entries: ImprovementPlanGroup[]
  ): ImprovementPlanGroup[] => entries

  it('heads the document and identifies the company and report', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({ group: group(), members: [member()] }),
    })

    expect(html).toContain('Úrbótaáætlun')
    expect(html).toContain('Testing-hugbúnaður ehf.')
    expect(html).toContain('000000-0000')
    expect(html).toContain('JLU-2026-0001')
    expect(html).toContain('21.05.2026')
  })

  /**
   * The whole point of the separate document: the group's name and its
   * explanation, which the salary report's flat table could not show at all.
   */
  it('renders each group with its name, ástæða, aðgerð and signature', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({ group: group(), members: [member()] }),
    })

    expect(html).toContain('Sérfræðingar í þróun')
    expect(html).toContain('Ástæða')
    expect(html).toContain('Munur skýrist af starfsaldri')
    expect(html).toContain('Aðgerð')
    expect(html).toContain('Laun verða jöfnuð við næstu endurskoðun')
    expect(html).toContain('Anna Jónsdóttir')
    expect(html).toContain('Mannauðsstjóri')
  })

  it('keeps each group’s members under its own heading', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups(
        {
          group: group({ id: 'g1', name: 'Hópur A', reason: 'Ástæða A' }),
          members: [member({ employeeOrdinal: 1 })],
        },
        {
          group: group({ id: 'g2', name: 'Hópur B', reason: 'Ástæða B' }),
          members: [member({ employeeOrdinal: 2 })],
        },
      ),
    })

    expect(html).toContain('Hópur A')
    expect(html).toContain('Hópur B')
    expect(html).toContain('Ástæða A')
    expect(html).toContain('Ástæða B')
    expect(html).toContain('Starfsmaður 1')
    expect(html).toContain('Starfsmaður 2')
    // Group A's heading must precede group B's members, i.e. the rows are not
    // flattened back into one table.
    expect(html.indexOf('Hópur A')).toBeLessThan(html.indexOf('Hópur B'))
    expect(html.indexOf('Ástæða A')).toBeLessThan(
      html.indexOf('Starfsmaður 2'),
    )
  })

  /**
   * Units on the rates. `4.750` alone reads as a monthly salary two orders of
   * magnitude too low.
   */
  it('renders member figures with units and a directional deviation', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({ group: group(), members: [member()] }),
    })

    expect(html).toContain('4.750 kr./klst.')
    expect(html).toContain('5.000 kr./klst.')
    expect(html).toContain('-5,0% (undir)')
    expect(html).toContain('42,5%')
    expect(html).toContain('Hlutur af óskýrðu')
  })

  // The list can name someone for being paid ABOVE their starfsmatsstig, which
  // is the opposite of what a reader expects, and a PDF reader cannot ask.
  it('says "yfir" outright for an overpaid member', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({
        group: group(),
        members: [
          member({ deviationPercent: 5, payStatus: PayStatusEnum.OVERPAID }),
        ],
      }),
    })

    expect(html).toContain('+5,0% (yfir)')
  })

  /**
   * The explanation columns are all-NULL or all-populated, enforced by
   * `report_outlier_group_explanation_chk`. All-NULL means postponed — not asked
   * yet — so the document says which state it is in rather than printing four
   * empty rows.
   */
  it('names the postponed state instead of printing empty explanation rows', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({
        group: group({
          reason: null,
          action: null,
          signatureName: null,
          signatureRole: null,
        }),
        members: [member()],
      }),
    })

    expect(html).toContain('Skýring liggur ekki fyrir')
    expect(html).toContain('frestur var veittur')
    expect(html).not.toContain('Hlutverk undirritanda')
  })

  // A group with no members is a data fault, not an empty state: groups exist
  // because outliers were assigned to them. An empty table would read as
  // "nobody needs correcting".
  it('calls out a group with no members rather than printing an empty table', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({ group: group(), members: [] }),
    })

    expect(html).toContain('Engir starfsmenn skráðir í þennan hóp.')
  })

  it('escapes applicant-authored group text', () => {
    const html = buildImprovementPlanHtml({
      report,
      groups: makeGroups({
        group: group({
          name: '<script>alert("x")</script>',
          reason: '<img src=x onerror=alert(1)>',
        }),
        members: [member()],
      }),
    })

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;script&gt;')
  })
})
