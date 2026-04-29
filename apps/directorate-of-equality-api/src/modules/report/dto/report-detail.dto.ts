import { ApiDto, ApiDtoArray, ApiOptionalDto } from '@dmr.is/decorators'

import { CompanyReportDto } from '../../company/dto/company-report.dto'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { ReportResultDto } from '../../report-result/dto/report-result.dto'
import { ReportRoleResultDto } from '../../report-result/dto/report-role-result.dto'
import { EqualityReportDto } from './equality-report.dto'
import { ReportDto } from './report.dto'
import { ReportTimelineItemDto } from './report-timeline-item.dto'

/**
 * Full detail payload for a single report. Extends the base `ReportDto`
 * with the supporting tree the admin UI renders on the detail screen:
 *
 * - `company`: immutable snapshot taken at submission time (from
 *   `CompanyReportModel`, not the live `CompanyModel`). Matches the
 *   "Upplýsingar um fyrirtæki" panel in the design.
 *
 * - `equalityReport`: **always** populated. For equality-type reports the
 *   block mirrors the requested report itself; for salary-type reports it's
 *   the linked equality (via `equalityReportId`). The invariant "no salary
 *   without equality" is enforced server-side — if a salary report has no
 *   equality link, the service throws rather than returning null.
 *
 * - `timeline`: merged, `createdAt`-sorted list of `report_event` and
 *   `report_comment` rows. Each item carries a `kind` discriminator
 *   (`EVENT` | `COMMENT`) and exactly one of `event` / `comment`
 *   populated. Paranoid-deleted comments are excluded.
 *
 * - `result` / `roleResults` / `employeeOutliers`: salary-only calculation
 *   outputs. For equality reports these are `null` / `[]`; for salary reports
 *   they're populated once the scoring engine has run. The UI uses them to
 *   render the Launagreining charts: `result` → gender-gap summary, `roleResults`
 *   → scatter-plot points per role, `employeeOutliers` → the Úrbótaáætlun
 *   table listing employees who fall outside the acceptable pay-gap threshold.
 */
export class ReportDetailDto extends ReportDto {
  @ApiDto(CompanyReportDto)
  company!: CompanyReportDto

  @ApiDto(EqualityReportDto)
  equalityReport!: EqualityReportDto

  @ApiDtoArray(ReportTimelineItemDto)
  timeline!: ReportTimelineItemDto[]

  @ApiOptionalDto(ReportResultDto, { nullable: true })
  result!: ReportResultDto | null

  @ApiDtoArray(ReportRoleResultDto)
  roleResults!: ReportRoleResultDto[]

  @ApiDtoArray(ReportEmployeeOutlierDto)
  employeeOutliers!: ReportEmployeeOutlierDto[]
}
