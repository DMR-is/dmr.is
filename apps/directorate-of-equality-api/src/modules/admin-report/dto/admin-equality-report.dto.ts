import { ApiEnum, ApiOptionalString, ApiString } from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
} from '../../report/models/report.enums'

export class AdminEqualityReportDto {
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
}
