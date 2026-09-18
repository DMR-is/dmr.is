import { Transform } from 'class-transformer'
import { isBase64 } from 'validator'

import {
  ApiDto,
  ApiEnum,
  ApiOptionalBase64File,
  ApiOptionalDtoArray,
  ApiOptionalHTML,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.enums'
import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './submit-report-company.dto'

/**
 * The report identifier is not supplied: it is a meaningless pseudonymous
 * handle, minted server-side at creation and returned on the report reads.
 *
 * `identifier` was accepted here until #1406, and a caller still sending one is
 * silently ignored rather than rejected — see db/README.md → "Report identifier"
 * for the island.is client change that pairs with its removal.
 */
export class SubmitEqualityReportDto {
  @ApiUUID({
    description:
      'Upstream island.is application UUID, stored as the report provider_id.',
  })
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

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  /*
   * Optional, not absent: a report's content is EITHER this or
   * `equalityReportPdf`, and the submit is rejected unless exactly one arrives.
   * That rule lives in `resolveEqualityContent` rather than here, because the
   * DTO can only see one field at a time and the other three write paths need
   * the same rule to mean the same thing.
   */
  @ApiOptionalHTML({
    description:
      'Narrative gender-equality plan as plain HTML. Persisted as `report.equality_report_content` and rendered into the approved PDF, so send the markup itself — not a base64 blob, not a document. Mutually exclusive with `equalityReportPdf`.',
  })
  @Transform(({ value }) => {
    // Base64 is no longer part of the contract, but the island.is client still
    // sends it, so a base64 body is decoded rather than stored verbatim. Remove
    // this branch once that client sends HTML — and note the edge it carries: a
    // very short plain-HTML-free value that happens to be valid base64
    // (`abcd`) is decoded as though it were encoded. Real markup contains
    // `<`, so it never matches.
    if (typeof value === 'string' && isBase64(value)) {
      return Buffer.from(value, 'base64').toString('utf-8')
    }
    return value
  })
  equalityReportContent?: string

  /*
   * ⚠️ **No `@Transform`, and that is deliberate — see `ApiOptionalBase64File`.**
   * The decode above is for markup; running it over a PDF would replace every
   * byte that is not valid UTF-8 with U+FFFD and corrupt the file silently.
   * Base64 stays base64 the whole way here: validated, persisted and served
   * back as-is.
   */
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

  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]
}
