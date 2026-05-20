import { ApiHTML } from '@dmr.is/decorators'

/**
 * Body for `PUT /api/v1/application/reports/:providerId/equality-content`.
 *
 * Strictly the narrative body of an equality report. The applicant may invoke
 * this only on reports in status `IN_REVIEW` (i.e. a reviewer has picked the
 * report up and asked for changes via comment). Status is preserved on edit
 * — the report stays `IN_REVIEW` so the assigned reviewer keeps their pickup;
 * the EDITED event is the audit signal that the applicant responded.
 */
export class EditEqualityContentDto {
  @ApiHTML({
    description:
      'New narrative content for the equality report as base64-encoded HTML. Decoded server-side and replaces the prior `equality_report_content` in place.',
  })
  equalityReportContent!: string
}
