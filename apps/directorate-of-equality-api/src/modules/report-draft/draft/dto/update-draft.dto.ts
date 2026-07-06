import {
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../../report/models/report.enums'

/**
 * Patch body for `PATCH /api/v1/application/reports/:providerId/draft`. Every
 * field is optional — PATCH semantics: an omitted key is left untouched, an
 * explicit `null` clears the column. Type-specific fields (the headcount
 * figures for SALARY, `equalityReportContent` for EQUALITY) are not enforced
 * here; cross-field validity is checked at submit, not while drafting.
 */
export class UpdateDraftDto {
  @ApiOptionalString({ nullable: true })
  companyAdminName?: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail?: string | null

  @ApiOptionalEnum(GenderEnum, { nullable: true, enumName: 'GenderEnum' })
  companyAdminGender?: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  contactName?: string | null

  @ApiOptionalString({ nullable: true })
  contactEmail?: string | null

  @ApiOptionalString({ nullable: true })
  contactPhone?: string | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount?: number | null

  @ApiOptionalString({ nullable: true })
  equalityReportContent?: string | null
}
