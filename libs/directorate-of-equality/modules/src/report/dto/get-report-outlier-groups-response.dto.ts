import { ApiProperty } from '@nestjs/swagger'

import { ReportOutlierGroupDto } from '../../report-employee/dto/report-outlier-group.dto'

/**
 * All outlier groups for a single report. A report with detected outliers
 * always has at least one group (the implicit "default group" when the
 * applicant did not split them). Drives the per-group tables in the salary
 * report's Úrbótaáætlun view.
 */
export class GetReportOutlierGroupsResponseDto {
  @ApiProperty({ type: [ReportOutlierGroupDto] })
  groups!: ReportOutlierGroupDto[]
}
