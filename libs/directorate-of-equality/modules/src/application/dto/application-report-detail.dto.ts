import {
  ApiBoolean,
  ApiDtoArray,
  ApiEnum,
  ApiOptionalBoolean,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanyReportDto } from '../../company/dto/company-report.dto'
import { EqualityReportSummaryDto } from '../../report/dto/equality-report-summary.dto'
import {
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { ReportResultDto } from '../../report-result/dto/report-result.dto'
import { ApplicationReportCommentDto } from './application-report-comment.dto'

export class ApplicationReportDetailDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiOptionalDateTime({ nullable: true })
  submittedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null

  @ApiDtoArray(CompanyReportDto)
  companies!: CompanyReportDto[]

  @ApiOptionalDto(EqualityReportSummaryDto, { nullable: true })
  equalityReport!: EqualityReportSummaryDto | null

  @ApiOptionalString({ nullable: true })
  equalityReportContent!: string | null

  @ApiOptionalEnum(SalaryDataBasisEnum, {
    nullable: true,
    enumName: 'SalaryDataBasisEnum',
    description:
      'Salary-only. Whether the submitted salary data describes one specific payroll month (`MONTH`, with the month in `salaryDataPeriod`) or a twelve-month average (`AVERAGE`). Reads back the basis the applicant declared while drafting. Null on equality reports.',
  })
  salaryDataBasis!: SalaryDataBasisEnum | null

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the salary data is based on, as an ISO date normalised to the 1st of that month (`YYYY-MM-01`). Set when `salaryDataBasis` is `MONTH`, null for `AVERAGE`.',
  })
  salaryDataPeriod!: string | null

  @ApiOptionalBoolean({
    nullable: true,
    description:
      'Salary-only. Null on equality reports. When true, every outlier on this salary report is postponed (explanation columns are NULL on each row). All-or-none — postponement applies to the whole report.',
  })
  outliersPostponed!: boolean | null

  @ApiBoolean({
    description:
      'True when the report has at least one employee outlier. The full list is fetched separately via `GET /application/reports/:providerId/outliers`.',
  })
  includesImprovementPlan!: boolean

  @ApiOptionalDto(ReportResultDto, { nullable: true })
  result!: ReportResultDto | null

  @ApiDtoArray(ApplicationReportCommentDto)
  externalComments!: ApplicationReportCommentDto[]

  @ApiOptionalString({ nullable: true })
  denialReason!: string | null
}
