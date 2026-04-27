import { ApiDto, ApiDtoArray, ApiOptionalDto } from '@dmr.is/decorators'

import { CompanyReportDto } from '../../company/dto/company-report.dto'
import { ReportCommentDto } from '../../report-comment/dto/report-comment.dto'
import { ReportEmployeeDeviationDto } from '../../report-employee/dto/report-employee-deviation.dto'
import { ReportResultDto } from '../../report-result/dto/report-result.dto'
import { ReportRoleResultDto } from '../../report-result/dto/report-role-result.dto'
import { EqualityReportDto } from './equality-report.dto'
import { ReportDto } from './report.dto'

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
 * - `comments`: most recent `ReportCommentModel` rows, both INTERNAL and
 *   EXTERNAL (admin context). Paranoid-deleted entries are excluded.
 *
 * - `result` / `roleResults` / `employeeDeviations`: salary-only calculation
 *   outputs. For equality reports these are `null` / `[]`; for salary reports
 *   they're populated once the scoring engine has run. The UI uses them to
 *   render the Launagreining charts: `result` → gender-gap summary, `roleResults`
 *   → scatter-plot points per role, `employeeDeviations` → the Úrbótaáætlun
 *   table listing employees who fall outside the acceptable pay-gap threshold.
 */
export class ReportDetailDto extends ReportDto {
  @ApiDto(CompanyReportDto)
  company!: CompanyReportDto

  @ApiDto(EqualityReportDto)
  equalityReport!: EqualityReportDto

  @ApiDtoArray(ReportCommentDto)
  comments!: ReportCommentDto[]

  @ApiOptionalDto(ReportResultDto, { nullable: true })
  result!: ReportResultDto | null

  @ApiDtoArray(ReportRoleResultDto)
  roleResults!: ReportRoleResultDto[]

  @ApiDtoArray(ReportEmployeeDeviationDto)
  employeeDeviations!: ReportEmployeeDeviationDto[]
}
