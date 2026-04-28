import { ArrayMinSize } from 'class-validator'

import {
  ApiDtoArray,
  ApiEnum,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
} from '../../report/models/report.enums'
import { CreateReportCompanySnapshotDto } from './create-report.dto'

/**
 * Request body for `POST /api/v1/reports/equality`. EQUALITY submissions are
 * a free-form narrative — no criteria, no employees, no Excel parsing. The
 * report type is implied by the endpoint, so the DTO does not carry it.
 */
export class CreateEqualityReportDto {
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

  @ApiDtoArray(CreateReportCompanySnapshotDto)
  @ArrayMinSize(1)
  companies!: CreateReportCompanySnapshotDto[]
}
