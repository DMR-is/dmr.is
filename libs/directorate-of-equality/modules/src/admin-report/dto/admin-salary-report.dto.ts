import { IsEmail, Min } from 'class-validator'

import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import { TrimString } from '../../report/lib/trim-string'
import {
  GenderEnum,
  ReportProviderEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { CreateReportOutlierGroupDto } from '../../report-create/dto/create-report.dto'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'

export class AdminSalaryReportDto {
  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiEnum(ReportProviderEnum)
  providerType!: ReportProviderEnum

  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiString()
  companyAdminName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle?: string | null

  @ApiString()
  @TrimString()
  @IsEmail()
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

  @ApiString()
  @TrimString()
  @IsEmail()
  contactEmail!: string

  @ApiString({ minLength: 1 })
  @TrimString()
  contactPhone!: string

  @ApiNumber()
  @Min(0)
  averageEmployeeMaleCount!: number

  @ApiNumber()
  @Min(0)
  averageEmployeeFemaleCount!: number

  @ApiNumber()
  @Min(0)
  averageEmployeeNeutralCount!: number

  @ApiEnum(SalaryDataBasisEnum, {
    enumName: 'SalaryDataBasisEnum',
    description:
      'Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`).',
  })
  salaryDataBasis!: SalaryDataBasisEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the data is based on, as an ISO date (`YYYY-MM-DD`; the day is normalised to the 1st). Required when `salaryDataBasis` is `MONTH`. Must name a month that is over — last month at the latest — and no earlier than 36 months ago.',
  })
  salaryDataPeriod?: string | null

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from the excel import endpoint. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  @ApiOptionalBoolean()
  postponed?: boolean

  @ApiOptionalDtoArray(CreateReportOutlierGroupDto)
  outlierGroups?: CreateReportOutlierGroupDto[]
}
