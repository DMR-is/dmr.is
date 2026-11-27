import {
  ApiOptionalBase64File,
  ApiOptionalHTML,
  ApiOptionalString,
} from '@dmr.is/decorators'

/**
 * Body for `PUT /api/v1/application/reports/:providerId/equality-content`.
 *
 * Strictly the narrative body of an equality report. The applicant may invoke
 * this only on reports in status `IN_REVIEW` (i.e. a reviewer has picked the
 * report up and asked for changes via comment). Status is preserved on edit
 * — the report stays `IN_REVIEW` so the assigned reviewer keeps their pickup;
 * the EDITED event is the audit signal that the applicant responded.
 *
 * A correction may switch representation: a report first submitted as HTML can
 * come back as a PDF and vice versa. Both fields are optional individually and
 * exactly one is required in practice — `resolveEqualityContent` enforces that,
 * and the replacement is wholesale either way, so the prior content and its
 * type are always replaced together and never left half-updated.
 */
export class EditEqualityContentDto {
  @ApiOptionalHTML({
    description:
      'New narrative content for the equality report as base64-encoded HTML. Decoded server-side and replaces the prior `equality_report_content` in place. Mutually exclusive with `equalityReportPdf`.',
  })
  equalityReportContent?: string

  @ApiOptionalBase64File({
    description:
      'New narrative content as a base64-encoded PDF, stored verbatim and replacing the prior content in place. Mutually exclusive with `equalityReportContent` and `equalityReportPdfKey`. Max 4MB decoded.',
  })
  equalityReportPdf?: string

  @ApiOptionalString({
    description:
      'File name of the uploaded PDF, shown in the review UI. Required when `equalityReportPdf` or `equalityReportPdfKey` is supplied.',
  })
  equalityReportPdfFilename?: string

  @ApiOptionalString({
    maxLength: 256,
    description:
      'Object key from `POST …/equality-content/presign` for a plan PDF already uploaded to the presigned URL. Stored exactly as an inline `equalityReportPdf` would be (max 4MB, must be a PDF). Requires `equalityReportPdfFilename`. Cannot be combined with a non-empty `equalityReportPdf` or `equalityReportContent` (400); a null beside the key is ignored and the key wins. **Single use:** a successful request consumes the upload; presign again for another file. Resending the key while it still names the current plan (a retry after a lost response) succeeds without changing the plan or recording a second edit.',
  })
  equalityReportPdfKey?: string
}
