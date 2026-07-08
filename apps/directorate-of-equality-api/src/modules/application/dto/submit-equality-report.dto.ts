import { Transform } from 'class-transformer'
import { isBase64 } from 'validator'

import {
  ApiDto,
  ApiEnum,
  ApiOptionalDtoArray,
  ApiOptionalNumber,
  ApiString,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.enums'
import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './submit-report-company.dto'

export class SubmitEqualityReportDto {
  @ApiString()
  identifier!: string

  @ApiString()
  providerId!: string

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

  @ApiString({
    minLength: 1,
    description:
      'Narrative gender-equality plan. Persisted as `report.equality_report_content`.',
  })
  @Transform(({ value }) => {
    if (isBase64(value)) {
      return Buffer.from(value, 'base64').toString('utf-8')
    }
    return value
  })
  equalityReportContent!: string

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount?: number

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount?: number

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount?: number

  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]
}
