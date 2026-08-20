import { ApiDto, ApiDtoArray, ApiEnum, ApiNumber } from '@dmr.is/decorators'

import { SalaryByGenderAndScoreDto } from './salary-by-gender-and-score.dto'

export enum SalaryAnalysisOutlierDirectionEnum {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  EQUAL = 'EQUAL',
}

export class SalaryAnalysisOutlierDto {
  @ApiNumber()
  employeeOrdinal!: number

  @ApiNumber()
  regularHourlyWage!: number

  @ApiEnum(SalaryAnalysisOutlierDirectionEnum)
  direction!: SalaryAnalysisOutlierDirectionEnum

  @ApiNumber()
  differencePercent!: number

  @ApiNumber()
  allowedDifferencePercent!: number

  @ApiNumber()
  predictedHourlyWage!: number

  @ApiNumber()
  scoreBucketRangeFrom!: number

  @ApiNumber()
  scoreBucketRangeTo!: number
}

export class SalaryAnalysisResponseDto {
  @ApiDtoArray(SalaryAnalysisOutlierDto)
  outliers!: SalaryAnalysisOutlierDto[]

  @ApiDto(SalaryByGenderAndScoreDto)
  regularHourlyWageByScoreAll!: SalaryByGenderAndScoreDto
}
