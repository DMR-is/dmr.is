import { IntersectionType, OmitType } from '@nestjs/swagger'

import { ApiHTML } from '@dmr.is/decorators'

import { SubmitEqualityReportDto } from './submit-equality-report.dto'

/**
 * What the partner channel accepts in place of the island.is content fields.
 *
 * `equalityReportContent` is **required** here, where it is optional on the
 * shared contract. On island.is it is optional because a report's content is
 * either HTML or a base64 PDF, and `resolveEqualityContent` decides which — a
 * rule the DTO cannot express, since it sees one field at a time. This channel
 * takes no PDF, so there is nothing for it to be exclusive with: the only
 * accepted form is markup, and requiring it says so in the published document
 * rather than letting the request reach a service error that names a field this
 * contract does not have.
 */
export class PartnerEqualityContentFields {
  @ApiHTML({
    description:
      'Narrative gender-equality plan as plain HTML. Persisted as-is and rendered into the approved PDF. Required: this channel accepts no other form of content.',
  })
  equalityReportContent!: string
}

/**
 * The partner API's equality submission.
 *
 * Three fields of the island.is contract are absent, all for one reason: they
 * describe a PDF, and a PDF is not how a plan arrives here.
 *
 * - **`equalityReportPdf` / `equalityReportPdfFilename`** — base64 PDF upload.
 *   It exists on the shared contract for the island.is client, whose applicant
 *   may attach a document rather than author markup. Publishing it here offered
 *   a vendor a second way to send one thing, with the exclusivity rule
 *   invisible in the schema: three optional content fields where exactly one
 *   was permitted, and the rule enforced a layer down in
 *   `resolveEqualityContent`.
 * - **`equalityReportContent`** — omitted and then reintroduced as *required*
 *   by `PartnerEqualityContentFields`, since `OmitType` cannot change a
 *   field's optionality in place.
 *
 * `OmitType` rather than a hand-written class: the remaining fields are the
 * same contract island.is submits, and a copy would drift from it field by
 * field. What this surface subtracts is the whole statement here — the same
 * shape `SubmitPartnerSalaryReportDto` uses, for the same reason.
 *
 * ⚠️ **This class is where the document upload lands.** When the plan starts
 * arriving as a `.docx` over `multipart/form-data`, `equalityReportContent`
 * comes off this class too and the HTML is produced server-side from the
 * uploaded file. Everything else here is unaffected, which is most of why the
 * content fields were isolated into their own class now.
 */
export class SubmitPartnerEqualityReportDto extends IntersectionType(
  OmitType(SubmitEqualityReportDto, [
    'equalityReportContent',
    'equalityReportPdf',
    'equalityReportPdfFilename',
  ] as const),
  PartnerEqualityContentFields,
) {}
