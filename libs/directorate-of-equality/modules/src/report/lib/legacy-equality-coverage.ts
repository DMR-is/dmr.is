import { EqualityReportSummaryDto } from '../dto/equality-report-summary.dto'
import { EqualityCoverageSourceEnum } from '../models/report.enums'

/**
 * `legacy_report.equality_valid_until` is a DATEONLY — the calendar date the
 * old SharePoint register stated the equality plan runs to, with no time and no
 * zone. Everything downstream compares timestamps, so it has to be given one,
 * and the choice is not free: read as midnight, a certificate stated valid
 * "until today" is already expired for the whole of the day it is still valid.
 *
 * End of day in UTC, therefore — the same convention the register load writes
 * into the timestamp columns (`… || ' 23:59:59+00'`, see m-20260911) and the
 * reason `activeLegacyCertificationExists` tests `>= CURRENT_DATE` rather than
 * `> NOW()`. Keeping the three in step is what stops the admin register, the
 * expiry queue and the portal from disagreeing about the last day of a
 * certificate.
 */
export function legacyValidUntilToDate(validUntil: string): Date {
  return new Date(`${validUntil}T23:59:59.000Z`)
}

/**
 * Whether a stated legacy expiry still covers the company right now.
 *
 * The date is the ONLY signal read on the equality side — never `validity` or
 * `legacyStatus`. Those two describe the *salary* certification, and 120 rows
 * carry a live `equality_valid_until` beside a lapsed one; reading them here
 * would deny coverage to every one of those companies. Same rule, and the same
 * reasoning, as `activeLegacyCertificationExists` in the admin register's
 * `report-status.ts` — the two have to agree or a company reads SATISFACTORY in
 * the back office while the portal tells it to file a plan it holds.
 */
export function isLegacyEqualityCoverageActive(
  validUntil: string | null,
  now: Date = new Date(),
): validUntil is string {
  if (!validUntil) {
    return false
  }

  return legacyValidUntilToDate(validUntil).getTime() >= now.getTime()
}

/**
 * The summary shape for coverage that came from the retired register.
 *
 * Every identity field is null and that is the honest answer, not a gap to be
 * filled later: the load mints no `report` row, so there is no id to quote, no
 * identifier to display and no channel handle that would resolve. `source` is
 * what a caller branches on.
 */
export function toLegacyEqualitySummary(
  validUntil: string,
): EqualityReportSummaryDto {
  return {
    source: EqualityCoverageSourceEnum.LEGACY,
    id: null,
    identifier: null,
    providerId: null,
    approvedAt: null,
    validUntil: legacyValidUntilToDate(validUntil),
  }
}
