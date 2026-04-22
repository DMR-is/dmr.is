import {
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiString,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../../report-employee/models/report-employee.model'

export class ParsedSubCriterionStepDto {
  @ApiNumber()
  order!: number

  @ApiString()
  description!: string

  @ApiNumber()
  score!: number
}

export class ParsedSubCriterionDto {
  @ApiString()
  title!: string

  @ApiString()
  description!: string

  @ApiNumber()
  weight!: number

  @ApiDtoArray(ParsedSubCriterionStepDto)
  steps!: ParsedSubCriterionStepDto[]
}

export class ParsedCriterionDto {
  @ApiEnum(ReportCriterionTypeEnum)
  type!: ReportCriterionTypeEnum

  @ApiString()
  title!: string

  @ApiString()
  description!: string

  @ApiNumber()
  weight!: number

  @ApiDtoArray(ParsedSubCriterionDto)
  subCriteria!: ParsedSubCriterionDto[]
}

export class ParsedStepAssignmentDto {
  @ApiString()
  criterionTitle!: string

  @ApiString()
  subTitle!: string

  @ApiNumber()
  stepOrder!: number
}

export class ParsedRoleDto {
  @ApiString()
  title!: string

  @ApiDtoArray(ParsedStepAssignmentDto)
  stepAssignments!: ParsedStepAssignmentDto[]
}

export class ParsedEmployeeDto {
  @ApiNumber()
  ordinal!: number

  @ApiString()
  roleTitle!: string

  @ApiEnum(EducationEnum)
  education!: EducationEnum

  @ApiEnum(GenderEnum)
  gender!: GenderEnum

  @ApiString()
  field!: string

  @ApiString()
  department!: string

  @ApiString()
  startDate!: string

  @ApiNumber()
  workRatio!: number

  @ApiNumber()
  baseSalary!: number

  @ApiNumber()
  additionalSalary!: number

  @ApiOptionalNumber({ nullable: true })
  bonusSalary!: number | null

  @ApiDtoArray(ParsedStepAssignmentDto)
  personalStepAssignments!: ParsedStepAssignmentDto[]
}

/**
 * The shape `/import` returns. Contains only data that lives in the workbook:
 * criteria tree, roles, employees. Report-level metadata (admin / contact
 * details) and company identification come from the app-system's auth
 * context, not from us — including them here would be echoing back the
 * caller's own input.
 */
export class ParsedReportDto {
  @ApiDtoArray(ParsedCriterionDto)
  criteria!: ParsedCriterionDto[]

  @ApiDtoArray(ParsedRoleDto)
  roles!: ParsedRoleDto[]

  @ApiDtoArray(ParsedEmployeeDto)
  employees!: ParsedEmployeeDto[]
}
