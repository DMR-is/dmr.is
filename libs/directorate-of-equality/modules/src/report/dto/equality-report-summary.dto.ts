import {
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { EqualityCoverageSourceEnum } from '../models/report.enums'

/**
 * Slim view of whatever currently meets a company's equality obligation.
 *
 * Two things can: an APPROVED, in-force EQUALITY report filed here, or an
 * unexpired certificate from the Directorate's retired SharePoint register.
 * `source` says which, and it has to be read before anything else on this
 * object, because the LEGACY case carries no identity at all — the register
 * load mints no `report` row (see `LegacyReportModel`), so there is no id, no
 * identifier and no submission handle to give. Only `validUntil` is populated,
 * from `legacy_report.equality_valid_until`.
 *
 * Distinct from `EqualityReportDto` because callers do not need the narrative
 * `content` or `correctionDeadline` here; status is implied by the filter.
 */
export class EqualityReportSummaryDto {
  /**
   * Which of the two kinds of coverage this is. `REPORT` populates every field
   * below; `LEGACY` populates `validUntil` and nothing else.
   *
   * ⚠️ A caller that branches on `id != null` instead is reading the right
   * answer for the wrong reason and will keep working only until something else
   * nulls the id.
   */
  @ApiEnum(EqualityCoverageSourceEnum, {
    enumName: 'EqualityCoverageSourceEnum',
    description:
      'Where the coverage comes from: `REPORT` (an approved, in-force equality report filed in this system) or `LEGACY` (an unexpired certificate from the Directorate’s retired register, which has no report row behind it).',
  })
  source!: EqualityCoverageSourceEnum

  /**
   * The DoE-side primary key. Pass it back as `equalityReportId` when
   * submitting a salary report — or omit the field and let the server resolve
   * it, which is the only option on `LEGACY` and what the partner API always
   * does. It is *not* a lookup handle for application callers: the only route
   * keyed by it, `GET /reports/:id`, is admin-only.
   *
   * **Null when `source` is `LEGACY`.**
   */
  @ApiOptionalUUID({ nullable: true })
  id!: string | null

  /**
   * Short display code (e.g. `KTPQZW`) shown to humans in mail and support
   * tickets. Not a lookup handle either. Null when `source` is `LEGACY` — the
   * old register issued its own case numbers, which this system does not mint
   * or resolve.
   */
  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  /**
   * The submission handle **as the calling channel knows it**, and the value
   * that channel's `GET .../reports/:providerId` resolves against: the
   * island.is application UUID on island.is, the vendor's own id on the partner
   * API (the stored value is namespaced by company; the namespace is stripped
   * here and never exposed).
   *
   * `null` when the report cannot be reached from the calling channel — an
   * admin- or Excel-created report, one filed on a different channel, or
   * `LEGACY` coverage, which was never filed here at all — in which case no
   * content route can reach it and a handle would only 404.
   *
   * Resolved by `ReportProviderChannel.toClientProviderId`, never read off the
   * row.
   */
  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  /** Null when `source` is `LEGACY`: the old register recorded no approval date. */
  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  /**
   * When the coverage lapses. On `LEGACY` this is
   * `legacy_report.equality_valid_until` — a calendar date, returned as the end
   * of that day (23:59:59Z), the same convention the register load writes into
   * the timestamp columns so a certificate stated valid "until today" is valid
   * through today rather than expiring at midnight.
   */
  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
