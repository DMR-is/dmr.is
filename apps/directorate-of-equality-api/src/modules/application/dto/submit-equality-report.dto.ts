import {
  ApiDto,
  ApiEnum,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
} from '../../report/models/report.enums'
import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './submit-report-company.dto'

export class SubmitEqualityReportDto {
  @ApiString()
  identifier!: string

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
