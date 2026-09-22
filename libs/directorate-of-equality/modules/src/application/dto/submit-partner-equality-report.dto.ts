import { OmitType } from '@nestjs/swagger'

import { SubmitEqualityReportDto } from './submit-equality-report.dto'

/**
 * The partner API's equality submission: every field of the shared contract
 * except the plan's content, which arrives as an uploaded `.docx` instead.
 *
 * All three content fields of `SubmitEqualityReportDto` are absent, for one
 * reason each:
 *
 * - **`equalityReportPdf` / `equalityReportPdfFilename`** — a base64 PDF. It
 *   exists on the shared contract for the island.is client, whose applicant may
 *   attach a document rather than author markup. Publishing it here offered a
 *   vendor a second way to send one thing, with the exclusivity rule invisible
 *   in the schema.
 * - **`equalityReportContent`** — HTML. Most employers keep the plan in Word,
 *   so asking a payroll vendor for markup pushed a conversion problem onto the
 *   party least able to solve it. The route takes the `.docx` and converts it,
 *   so the field has no sender left on this channel.
 *
 * **The document is the only way in here, and HTML is the only way in on
 * island.is** — whose editor already produces markup, and wrapping that in a
 * `.docx` to hand it back would be absurd. Each channel takes the form its
 * users actually hold, and neither has two ways to send one thing. What both
 * store is the same HTML, so nothing downstream can tell them apart.
 *
 * `OmitType` rather than a hand-written class: the remaining fields are the
 * same contract island.is submits, and a copy would drift from it field by
 * field. What this surface subtracts is stated once, here.
 */
export class SubmitPartnerEqualityReportDto extends OmitType(
  SubmitEqualityReportDto,
  [
    'equalityReportContent',
    'equalityReportPdf',
    'equalityReportPdfFilename',
  ] as const,
) {}
