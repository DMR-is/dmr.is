import { ArrayMinSize } from 'class-validator'

import {
  ApiDtoArray,
  ApiEnum,
  ApiHTML,
  ApiOptionalNumber,
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
 *
 * The report identifier is not carried either: it is a meaningless pseudonymous
 * handle, minted by `ReportCreateService` when the row is created.
 *
 * `identifier` was accepted here until #1406 — see db/README.md → "Report
 * identifier" for the island.is client change that pairs with its removal.
 */
export class CreateEqualityReportDto {
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
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  @ApiHTML({
    description:
      'Narrative gender-equality plan as base64-encoded HTML. Decoded server-side and persisted as `report.equality_report_content`.',
  })
  equalityReportContent!: string

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount?: number | null

  @ApiDtoArray(CreateReportCompanySnapshotDto)
  @ArrayMinSize(1)
  companies!: CreateReportCompanySnapshotDto[]
}
