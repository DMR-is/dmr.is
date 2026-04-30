import {
  ApiDtoArray,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanyReportDto } from '../../company/dto/company-report.dto'
import { EqualityReportSummaryDto } from '../../report/dto/equality-report-summary.dto'
import {
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.enums'
import { ReportCommentDto } from '../../report-comment/dto/report-comment.dto'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { ReportResultDto } from '../../report-result/dto/report-result.dto'

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

  @ApiDtoArray(ReportEmployeeOutlierDto)
  outliers!: ReportEmployeeOutlierDto[]

  @ApiOptionalDto(ReportResultDto, { nullable: true })
  result!: ReportResultDto | null

  @ApiDtoArray(ReportCommentDto)
  externalComments!: ReportCommentDto[]

  @ApiOptionalString({ nullable: true })
  denialReason!: string | null
}
