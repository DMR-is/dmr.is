import {
  AggregateStatisticPointDto,
  AggregateStatisticSeriesDto,
  AggregateStatisticUnitEnum,
} from '../dto/aggregate-statistics.dto'

/**
 * Pure aggregation for the public statistics feed.
 *
 * Kept out of the service so the disclosure rule and the month walk can be
 * tested without a database — they are the two places where a mistake is
 * either a privacy incident or a published figure nobody can reproduce.
 */

/**
 * Fewest underlying reports behind a DERIVED figure before it may be published.
 *
 * ⚠️ Applies to the pay-gap averages and nothing else, and the distinction is
 * deliberate. A pay gap is computed from individual salary rows, so a mean over
 * two companies in one sector is close to publishing each of them; five is the
 * usual floor for statistical disclosure control and is what this enforces.
 *
 * Compliance COUNTS are not suppressed. Whether a company holds a valid
 * jafnréttisáætlun or skýrslugjöf is a fact the Directorate already publishes
 * per sector on its own dashboard, and suppressing "3 ráðuneyti" would withhold
 * the regulator's own headline while protecting nothing — the denominator is
 * public either way.
 */
export const MINIMUM_COHORT = 5

/** Milliseconds since epoch as a string — the x-axis key for a time series. */
export const timeHeader = (date: Date): string => String(date.getTime())

/** First instant of the UTC month `date` falls in. */
export const monthStart = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))

/**
 * Every month start from `from` to `to` inclusive, ascending.
 *
 * A chart with gaps where a month had no activity reads as missing data, so the
 * walk emits every month and the caller fills zeroes — absence of filings is a
 * fact worth plotting.
 */
export const monthsBetween = (from: Date, to: Date): Date[] => {
  const months: Date[] = []
  const cursor = monthStart(from)
  const last = monthStart(to)

  while (cursor <= last) {
    months.push(new Date(cursor))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return months
}

/**
 * A mean, withheld when too few values stand behind it.
 *
 * Returns `null` rather than `0` for an empty or too-small cohort: a gap that
 * may not be published and a gap of zero are opposite claims, and the contract
 * makes `value` nullable precisely so they stay distinguishable.
 */
export const suppressedMean = (
  values: readonly number[],
  minimumCohort = MINIMUM_COHORT,
): number | null => {
  if (values.length < minimumCohort) return null

  const total = values.reduce((sum, value) => sum + value, 0)
  return round(total / values.length, 2)
}

/**
 * Share of `part` in `whole` as a fraction (0–1), or null when there is nothing
 * to divide. Three decimals keeps one decimal once displayed as a percent.
 */
export const shareOf = (part: number, whole: number): number | null =>
  whole === 0 ? null : round(part / whole, 3)

/**
 * Percent points (e.g. `4.25`) as a fraction (`0.0425`) — the scale every
 * `PERCENT` series is published in, since the island.is chart formatter
 * multiplies by 100 for display.
 */
export const pointsToFraction = (value: number | null): number | null =>
  value === null ? null : round(value / 100, 4)

export const round = (value: number, precision = 0): number => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/**
 * Whether an approved report covered its company during the month starting at
 * `month`.
 *
 * Coverage is an interval, not an event: a report approved in March 2024 and
 * valid until March 2027 covers every month between. `validUntil` missing means
 * still in force, which is why it is treated as open-ended rather than skipped.
 */
export const coversMonth = (
  report: { approvedAt: Date | null; validUntil: Date | null },
  month: Date,
): boolean => {
  if (!report.approvedAt) return false

  const monthEnd = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1),
  )

  if (report.approvedAt >= monthEnd) return false
  return !report.validUntil || report.validUntil >= month
}

export const series = (
  key: string,
  label: string,
  unit: AggregateStatisticUnitEnum,
  points: AggregateStatisticPointDto[],
): AggregateStatisticSeriesDto => ({ key, label, unit, points })

export const point = (
  header: string,
  value: number | null,
): AggregateStatisticPointDto => ({ header, value })
