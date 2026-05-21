import {
  ApiDto,
  ApiEnum,
  ApiOptionalDtoArray,
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
  equalityReportContent!: string

  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]
}
