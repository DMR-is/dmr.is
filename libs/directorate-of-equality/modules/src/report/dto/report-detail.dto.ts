import {
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiOptionalDto,
} from '@dmr.is/decorators'

import { CompanyReportDto } from '../../company/dto/company-report.dto'
import { ReportResultDto } from '../../report-result/dto/report-result.dto'
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
 * - `subsidiaries`: immutable snapshots of the subsidiary companies the
 *   parent reported on, taken at submission time. One row per subsidiary
 *   (`parentCompanyId` set to the parent's `companyId`). Empty array when
 *   the submission covered only the parent.
 *
 * - `equalityReport`: the equality content block. For equality-type reports it
 *   mirrors the requested report itself; for salary-type reports it's the
 *   linked equality (via `equalityReportId`). **Null in exactly one case:** a
 *   salary report filed against a legacy certificate (`equalitySource` =
 *   `LEGACY`), which has no report row behind it to project — read
 *   `equalityLegacyValidUntil` for what covered it instead. The invariant "no
 *   salary without equality" still holds and is still enforced server-side; a
 *   salary report that claims a link and has none is a data-integrity error and
 *   the service throws rather than returning null.
 *
 * - `timeline`: merged, `createdAt`-sorted list of `report_event` and
 *   `report_comment` rows. Each item carries a `kind` discriminator
 *   (`EVENT` | `COMMENT`) and exactly one of `event` / `comment`
 *   populated. Paranoid-deleted comments are excluded.
 *
 * - `result` / `roleResults`: salary-only calculation outputs. For equality
 *   reports these are `null` / `[]`; for salary reports they're populated
 *   once the scoring engine has run. The UI uses them to render the
 *   Skýrslugjöf charts: `result` → gender-gap summary, `roleResults` →
 *   scatter-plot points per role.
 *
 * - `includesImprovementPlan`: cheap boolean indicating whether the
 *   Úrbótaáætlun (improvement plan) table has any rows. The full,
 *   potentially-large list is served by a separate paginated endpoint
 *   (`GET /reports/:id/outliers`) — the detail view only carries the flag
 *   so it stays small for reports with hundreds of outliers.
 */
export class ReportDetailDto extends ReportDto {
  @ApiDto(CompanyReportDto)
  company!: CompanyReportDto

  @ApiDtoArray(CompanyReportDto)
  subsidiaries!: CompanyReportDto[]

  @ApiOptionalDto(EqualityReportDto, { nullable: true })
  equalityReport!: EqualityReportDto | null

  @ApiDtoArray(ReportTimelineItemDto)
  timeline!: ReportTimelineItemDto[]

  @ApiOptionalDto(ReportResultDto, { nullable: true })
  result!: ReportResultDto | null

  @ApiBoolean({
    description:
      'Daily-fines flag. `true` means the company is currently in the daily-fines process.',
  })
  companyFinesStarted!: boolean

  @ApiBoolean({
    description:
      'Quarantine flag. `true` means the company is currently quarantined.',
  })
  companyQuarantined!: boolean

  @ApiBoolean({
    description:
      'True when the report has at least one employee outlier. The full list is fetched separately via `GET /reports/:id/outliers`.',
  })
  includesImprovementPlan!: boolean
}
