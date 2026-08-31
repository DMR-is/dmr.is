import { BadRequestException } from '@nestjs/common'

import { REPORT_VALIDITY_YEARS } from '../../constants'

/**
 * Validation for `report_outlier_group.remedy_date` — the date a group commits
 * to having its úrbætur completed by.
 *
 * Shared by every ingress (report create, the application-side outliers edit,
 * and the draft sync batch) rather than written per call site: the bound is a
 * property of the field, and a path that skipped it would let the API accept a
 * date the others reject.
 *
 * ⚠️ Deliberately NOT a DB CHECK. "In the future" is true when the row is
 * written and false forever after, so a constraint would reject every later
 * UPDATE of a row whose date has simply passed — including one that only
 * touches `name`. The bound belongs at the point of write.
 */

/** `YYYY-MM-DD`, the `DATEONLY` wire format. Rejects `2027-3-1` and timestamps. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Today at UTC midnight — the floor a remedy date must clear. */
const startOfUtcToday = (): Date => {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
}

/**
 * Parses and bounds a remedy date, returning it in its canonical `YYYY-MM-DD`
 * form. Throws 400 on anything the column or the bound would not accept.
 *
 * The upper bound is the next reporting cycle: a company may commit to úrbætur
 * any time between now and its next salary report, but a date beyond that
 * belongs to a period this report cannot speak for.
 */
export function parseRemedyDate(value: string): string {
  const trimmed = value.trim()

  if (!ISO_DATE.test(trimmed)) {
    throw new BadRequestException(
      `remedyDate must be an ISO date (YYYY-MM-DD), got "${value}"`,
    )
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`remedyDate "${value}" is not a valid date`)
  }
  // Catches a well-formed string naming a day that does not exist — `2027-02-31`
  // matches the pattern and parses, but rolls over to March.
  if (parsed.toISOString().slice(0, 10) !== trimmed) {
    throw new BadRequestException(`remedyDate "${value}" is not a valid date`)
  }

  const today = startOfUtcToday()
  if (parsed <= today) {
    // Reached on an edit as well as a create: the explanation block is
    // all-or-none, so revising a group's `reason` resends its stored date, and
    // a date that has since elapsed lands here. Forcing a fresh commitment is
    // the intent — say so, or the admin reads a 400 about a field they did not
    // touch.
    throw new BadRequestException(
      `remedyDate must be in the future — a group whose committed date has passed must commit to a new one, got "${trimmed}"`,
    )
  }

  const latest = new Date(today)
  latest.setUTCFullYear(latest.getUTCFullYear() + REPORT_VALIDITY_YEARS)
  if (parsed > latest) {
    throw new BadRequestException(
      `remedyDate must be no more than ${REPORT_VALIDITY_YEARS} years out (on or before ${latest
        .toISOString()
        .slice(0, 10)}), got "${trimmed}"`,
    )
  }

  return trimmed
}
