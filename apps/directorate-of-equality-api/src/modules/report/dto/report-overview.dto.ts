import { ApiProperty } from '@nestjs/swagger'

export class ReportOverviewGeneralDto {
  @ApiProperty()
  submittedToday!: number

  @ApiProperty()
  inProgress!: number

  @ApiProperty()
  reportsWithComments!: number

  @ApiProperty()
  reportsWithoutEmployee!: number
}

export class ReportOverviewAssignedDto {
  @ApiProperty()
  totalAssigned!: number

  @ApiProperty()
  assignedWithComments!: number
}

export class ReportOverviewDto {
  @ApiProperty({ type: ReportOverviewGeneralDto })
  general!: ReportOverviewGeneralDto

  @ApiProperty({ type: ReportOverviewAssignedDto })
  assigned!: ReportOverviewAssignedDto
}
