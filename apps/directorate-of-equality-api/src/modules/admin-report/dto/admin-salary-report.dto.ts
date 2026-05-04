import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
} from '../../report/models/report.enums'
import { CreateReportOutlierDto } from '../../report-create/dto/create-report.dto'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'

export class AdminSalaryReportDto {
  @ApiUUID({
    description:
      'FK to the approved EQUALITY report this salary was audited against.',
  })
  equalityReportId!: string

  @ApiString()
  identifier!: string

  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiEnum(ReportProviderEnum)
  providerType!: ReportProviderEnum

  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiString()
  companyAdminName!: string

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

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from the excel import endpoint. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  @ApiOptionalDtoArray(CreateReportOutlierDto)
  outliers?: CreateReportOutlierDto[]
}
