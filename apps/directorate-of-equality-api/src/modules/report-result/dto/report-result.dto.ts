import {
  ApiDto,
  ApiDtoArray,
  ApiNumber,
  ApiOptionalNumber,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

export class SalaryAggregateMetricsDto {
  @ApiOptionalNumber({ nullable: true })
  average!: number | null

  @ApiOptionalNumber({ nullable: true })
  median!: number | null

  @ApiOptionalNumber({ nullable: true })
  minimum!: number | null

  @ApiOptionalNumber({ nullable: true })
  maximum!: number | null
}

export class SalaryDifferencesDto {
  @ApiOptionalNumber({ nullable: true })
  maleFemale!: number | null

  @ApiOptionalNumber({ nullable: true })
  maleNeutral!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleMale!: number | null

  @ApiOptionalNumber({ nullable: true })
  femaleNeutral!: number | null

  @ApiOptionalNumber({ nullable: true })
  neutralMale!: number | null

  @ApiOptionalNumber({ nullable: true })
  neutralFemale!: number | null
}

export class ReportSalaryAggregateDto {
  @ApiDto(SalaryAggregateMetricsDto)
  overall!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  male!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  female!: SalaryAggregateMetricsDto

  @ApiDto(SalaryAggregateMetricsDto)
  neutral!: SalaryAggregateMetricsDto

  @ApiDto(SalaryDifferencesDto)
  salaryDifferences!: SalaryDifferencesDto
}

export class SalaryCohortCountsDto {
  @ApiNumber()
  overall!: number

  @ApiNumber()
  male!: number

  @ApiNumber()
  female!: number

  @ApiNumber()
  neutral!: number
}

export class SalaryScoreBucketDto {
  @ApiNumber()
  rangeFrom!: number

  @ApiNumber()
  rangeTo!: number

  @ApiDto(ReportSalaryAggregateDto)
  totals!: ReportSalaryAggregateDto

  @ApiDto(SalaryCohortCountsDto)
  counts!: SalaryCohortCountsDto
}

export class ReportSalaryResultSnapshotDto {
  @ApiDto(ReportSalaryAggregateDto)
  totals!: ReportSalaryAggregateDto

  @ApiDtoArray(SalaryScoreBucketDto)
  scoreBuckets!: SalaryScoreBucketDto[]
}

export class ReportRoleResultDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportResultId!: string

  @ApiUUId()
  reportEmployeeRoleId!: string

  @ApiString()
  roleTitle!: string

  @ApiDto(ReportSalaryResultSnapshotDto)
  base!: ReportSalaryResultSnapshotDto

  @ApiDto(ReportSalaryResultSnapshotDto)
  full!: ReportSalaryResultSnapshotDto
}

export class ReportResultDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiOptionalNumber({ nullable: true })
  salaryDifferenceThresholdPercent!: number | null

  @ApiString()
  calculationVersion!: string

  @ApiDto(ReportSalaryResultSnapshotDto)
  base!: ReportSalaryResultSnapshotDto

  @ApiDto(ReportSalaryResultSnapshotDto)
  full!: ReportSalaryResultSnapshotDto
}
