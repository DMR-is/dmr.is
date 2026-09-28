import { ApiProperty } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportStatusEnum, ReportTypeEnum } from '../models/report.enums'

/**
 * The average headcount a company declared on one of its own submissions.
 *
 * The figures are the report's `average_employee_*_count` columns as filed —
 * averages, so they can be fractional. Neutral stays its own figure here: this
 * is raw headcount, not the pay-gap split that bundles it with women.
 */
export class EmployeeCountHistoryEntryDto {
  @ApiUUId()
  reportId!: string

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiDateTime({ description: 'When the report was submitted.' })
  submittedAt!: Date

  @ApiEnum(CompanySizeEnum, {
    enumName: 'CompanySizeEnum',
    description:
      "The company's size bracket as it stood when this report was filed, from the report's company snapshot. Admin-curated, not the company's own declaration, so it can disagree with the counts beside it.",
  })
  employeeCountCategory!: CompanySizeEnum

  @ApiOptionalNumber({ nullable: true })
  femaleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  maleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  neutralCount!: number | null

  @ApiNumber({
    description:
      'Sum of the three figures, a missing one counting as zero. Neutral is included.',
  })
  totalCount!: number
}

export class GetEmployeeCountHistoryResponseDto {
  @ApiProperty({
    type: [EmployeeCountHistoryEntryDto],
    description: 'Newest first.',
  })
  entries!: EmployeeCountHistoryEntryDto[]
}
