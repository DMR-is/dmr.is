import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { CreateReportOutlierGroupDto } from '../../report-create/dto/create-report.dto'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './submit-report-company.dto'

export class SubmitSalaryReportDto {
  @ApiUUID({
    description:
      'FK to the approved EQUALITY report this salary was audited against.',
  })
  equalityReportId!: string

  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiString()
  providerId!: string

  @ApiString()
  companyAdminName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle?: string | null

  @ApiString()
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  @ApiNumber()
  averageEmployeeMaleCount!: number

  @ApiNumber()
  averageEmployeeFemaleCount!: number

  @ApiNumber()
  averageEmployeeNeutralCount!: number

  @ApiEnum(SalaryDataBasisEnum, {
    enumName: 'SalaryDataBasisEnum',
    description:
      'Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`). The submittee must declare one.',
  })
  salaryDataBasis!: SalaryDataBasisEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the data is based on, as an ISO date (`YYYY-MM-DD`; any day within the month is accepted and normalised to the 1st). Required when `salaryDataBasis` is `MONTH`, ignored for `AVERAGE`. Must name a month that has already happened, no earlier than 36 months ago.',
  })
  salaryDataPeriod?: string | null

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from `POST /reports/excel/import`. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]

  @ApiOptionalBoolean({
    description:
      'When true, defers every outlier explanation on this report. Defaults to false. All-or-none — postponement applies to the whole report, not individual rows.',
  })
  outliersPostponed?: boolean

  @ApiOptionalDtoArray(CreateReportOutlierGroupDto)
  outlierGroups?: CreateReportOutlierGroupDto[]
}
