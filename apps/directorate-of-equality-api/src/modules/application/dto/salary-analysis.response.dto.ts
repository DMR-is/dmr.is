import {
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
} from '@dmr.is/decorators'

import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'

export enum SalaryAnalysisOutlierDirectionEnum {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  EQUAL = 'EQUAL',
}

export class SalaryAnalysisOutlierDto {
  @ApiNumber()
  employeeOrdinal!: number

  @ApiNumber()
  adjustedBaseSalary!: number

  @ApiEnum(SalaryAnalysisOutlierDirectionEnum)
  direction!: SalaryAnalysisOutlierDirectionEnum

  @ApiNumber()
  differencePercent!: number

  @ApiNumber()
  allowedDifferencePercent!: number

  @ApiOptionalNumber({ nullable: true })
  referenceSalary!: number | null

  @ApiNumber()
  scoreBucketRangeFrom!: number

  @ApiNumber()
  scoreBucketRangeTo!: number
}

export class SalaryAnalysisResponseDto {
  @ApiDtoArray(SalaryAnalysisOutlierDto)
  outliers!: SalaryAnalysisOutlierDto[]

  @ApiDto(SalaryByGenderAndScoreDto)
  baseSalaryByGenderAndScoreAll!: SalaryByGenderAndScoreDto
}
