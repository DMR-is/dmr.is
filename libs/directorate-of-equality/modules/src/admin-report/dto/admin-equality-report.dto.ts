import {
  ApiEnum,
  ApiOptionalBase64File,
  ApiOptionalHTML,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

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

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  // Exactly one of this and `equalityReportPdf` is required — enforced in
  // `resolveEqualityContent`, which is shared with the other write paths.
  @ApiOptionalHTML({
    description:
      'Narrative gender-equality plan as base64-encoded HTML. Decoded server-side and persisted as `report.equality_report_content`. Mutually exclusive with `equalityReportPdf`.',
  })
  equalityReportContent?: string

  @ApiOptionalBase64File({
    description:
      'Narrative gender-equality plan as a base64-encoded PDF, stored verbatim. Mutually exclusive with `equalityReportContent`. Max 4MB decoded.',
  })
  equalityReportPdf?: string

  @ApiOptionalString({
    description:
      'File name of the uploaded PDF, shown in the review UI. Required when `equalityReportPdf` is supplied.',
  })
  equalityReportPdfFilename?: string

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount?: number | null
}
