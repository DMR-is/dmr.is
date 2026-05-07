import {
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { SalaryOutlierAnalysisMethodEnum } from '../../report/lib/compensation-aggregates'
import { GenderEnum } from '../../report/models/report.model'

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

export class SalaryOutlierRegressionDto {
  @ApiOptionalNumber({ nullable: true })
  slope!: number | null

  @ApiOptionalNumber({ nullable: true })
  intercept!: number | null

  @ApiNumber()
  sampleCount!: number

  @ApiOptionalNumber({ nullable: true })
  scoreMean!: number | null

  @ApiOptionalNumber({ nullable: true })
  adjustedBaseSalaryMean!: number | null

  @ApiOptionalNumber({ nullable: true })
  rSquared!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreRangeFrom!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreRangeTo!: number | null
}

export class SalaryOutlierRegressionsDto {
  @ApiDto(SalaryOutlierRegressionDto)
  overall!: SalaryOutlierRegressionDto

  @ApiDto(SalaryOutlierRegressionDto)
  male!: SalaryOutlierRegressionDto

  @ApiDto(SalaryOutlierRegressionDto)
  female!: SalaryOutlierRegressionDto

  @ApiDto(SalaryOutlierRegressionDto)
  neutral!: SalaryOutlierRegressionDto
}

export class SalaryOutlierAnalysisEmployeeDto {
  @ApiNumber()
  ordinal!: number

  @ApiNumber()
  score!: number

  @ApiEnum(GenderEnum)
  gender!: GenderEnum

  @ApiNumber()
  adjustedBaseSalary!: number

  @ApiOptionalNumber({ nullable: true })
  predictedBaseSalary!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreBucketRangeFrom!: number | null

  @ApiOptionalNumber({ nullable: true })
  scoreBucketRangeTo!: number | null

  @ApiOptionalString({ nullable: true })
  direction!: string | null

  @ApiOptionalNumber({ nullable: true })
  differencePercent!: number | null

  @ApiNumber()
  allowedDifferencePercent!: number

  @ApiBoolean()
  isOutlier!: boolean
}

export class SalaryOutlierAnalysisDto {
  @ApiEnum(SalaryOutlierAnalysisMethodEnum)
  method!: SalaryOutlierAnalysisMethodEnum

  @ApiNumber()
  thresholdPercent!: number

  @ApiNumber()
  allowedDifferencePercent!: number

  @ApiDto(SalaryOutlierRegressionsDto)
  regressions!: SalaryOutlierRegressionsDto

  @ApiDtoArray(SalaryOutlierAnalysisEmployeeDto)
  employees!: SalaryOutlierAnalysisEmployeeDto[]
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

  @ApiDto(SalaryOutlierAnalysisDto)
  outlierAnalysis!: SalaryOutlierAnalysisDto
}
