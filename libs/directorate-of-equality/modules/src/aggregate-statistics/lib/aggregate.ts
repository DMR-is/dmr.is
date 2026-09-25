import {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../../company/models/company.enums'
import {
  StatisticsCertificationStatusEnum,
  StatisticsCompanyCellDto,
  StatisticsEmployeesDto,
  StatisticsRoundCellDto,
  StatisticsSectorEnum,
} from '../dto/aggregate-statistics.dto'

/**
 * Pure aggregation for the public statistics feed, kept out of the service so
 * the disclosure rules can be tested without a database.
 */

/**
 * Fewest companies behind a published headcount. Five is the usual floor for
 * statistical disclosure control: a sum over one company is its headcount.
 *
 * Company counts are not suppressed. Status per sector, region and size is
 * what the Directorate's own dashboard already publishes.
 */
export const MINIMUM_COHORT = 5

/** Region bucket for a company with no postcode, so region totals stay whole. */
export const UNKNOWN_REGION = 'Óþekkt'

/** One ACTIVE company, as read from the register. */
export type CompanyStatisticsRow = {
  region: string
  size: CompanySizeEnum
  sector: CompanySectorEnum
  /** An approved SALARY report filed here is in force. */
  salaryReportActive: boolean
  /** A legacy salary certificate is in force. */
  legacySalaryInForce: boolean
  /** `certification_type` of the in-force legacy certificate, verbatim. */
  legacyCertificationType: string | null
  /** `round` of the company's latest legacy row, verbatim ("1." … "4."). */
  legacyRound: string | null
  /** APPROVED SALARY reports filed here, in force or expired. */
  approvedSalaryReports: number
  /** Headcount from the in-force report (filer only). */
  reportHeadcount: number | null
  /** Headcount from the in-force legacy certificate. */
  legacyHeadcount: number | null
}

export const toStatisticsSector = (
  sector: CompanySectorEnum,
): StatisticsSectorEnum => {
  switch (sector) {
    case CompanySectorEnum.FYRIRTAEKI:
      return StatisticsSectorEnum.FYRIRTAEKI
    case CompanySectorEnum.RADUNEYTI:
    case CompanySectorEnum.RIKISADILI:
      return StatisticsSectorEnum.RIKISADILI
    case CompanySectorEnum.SVEITARFELAG:
      return StatisticsSectorEnum.SVEITARFELAG
    default:
      return StatisticsSectorEnum.UNKNOWN
  }
}

/** Normalised like the register's other free-text comparisons: trim + lowercase. */
const LEGACY_TYPE: Record<string, StatisticsCertificationStatusEnum> = {
  vottun: StatisticsCertificationStatusEnum.VOTTUN,
  staðfesting: StatisticsCertificationStatusEnum.STADFESTING,
}

export const certificationStatus = (
  row: Pick<
    CompanyStatisticsRow,
    'salaryReportActive' | 'legacySalaryInForce' | 'legacyCertificationType'
  >,
): StatisticsCertificationStatusEnum => {
  if (row.salaryReportActive) {
    return StatisticsCertificationStatusEnum.SKYRSLUGJOF
  }
  if (!row.legacySalaryInForce) {
    return StatisticsCertificationStatusEnum.NONE
  }
  const type = row.legacyCertificationType?.trim().toLowerCase() ?? ''
  return LEGACY_TYPE[type] ?? StatisticsCertificationStatusEnum.UNCLASSIFIED
}

/** `"2."` → `2`; anything that is not a positive whole number → null. */
export const parseRound = (round: string | null): number | null => {
  const match = round?.trim().match(/^(\d+)\.?$/)
  if (!match) return null
  const value = Number(match[1])
  return value > 0 ? value : null
}

/**
 * Validity round: the legacy register's round, plus one per approved
 * skýrslugjöf filed since. Null when neither says anything.
 */
export const validityRound = (
  row: Pick<CompanyStatisticsRow, 'legacyRound' | 'approvedSalaryReports'>,
): number | null => {
  const round = (parseRound(row.legacyRound) ?? 0) + row.approvedSalaryReports
  return round > 0 ? round : null
}

/** Headcount the company contributes under its status, or null when none is stated. */
export const headcountFor = (
  row: CompanyStatisticsRow,
  status: StatisticsCertificationStatusEnum,
): number | null => {
  switch (status) {
    case StatisticsCertificationStatusEnum.NONE:
      return null
    case StatisticsCertificationStatusEnum.SKYRSLUGJOF:
      return row.reportHeadcount
    default:
      return row.legacyHeadcount
  }
}

/** Counts rows by a composite key while keeping one representative per key. */
const tally = <T>(
  rows: readonly CompanyStatisticsRow[],
  cellOf: (row: CompanyStatisticsRow) => T | null,
  keyOf: (cell: T) => string,
): Array<T & { companies: number }> => {
  const cells = new Map<string, T & { companies: number }>()
  for (const row of rows) {
    const cell = cellOf(row)
    if (cell === null) continue
    const key = keyOf(cell)
    const existing = cells.get(key)
    if (existing) {
      existing.companies += 1
    } else {
      cells.set(key, { ...cell, companies: 1 })
    }
  }
  return [...cells.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, cell]) => cell)
}

const dimensionsOf = (row: CompanyStatisticsRow) => ({
  region: row.region,
  size: row.size,
  sector: toStatisticsSector(row.sector),
})

const dimensionsKey = (cell: ReturnType<typeof dimensionsOf>) =>
  `${cell.region}|${cell.size}|${cell.sector}`

/** Region × size × sector × status. Only non-empty cells are emitted. */
export const companyCells = (
  rows: readonly CompanyStatisticsRow[],
): StatisticsCompanyCellDto[] =>
  tally(
    rows,
    (row) => ({ ...dimensionsOf(row), status: certificationStatus(row) }),
    (cell) => `${dimensionsKey(cell)}|${cell.status}`,
  )

/**
 * Region × size × sector × round, over companies with something in force.
 * Deliberately without status, so it cannot be joined with `companyCells`
 * into a finer grain than either.
 */
export const roundCells = (
  rows: readonly CompanyStatisticsRow[],
): StatisticsRoundCellDto[] =>
  tally(
    rows,
    (row) =>
      certificationStatus(row) === StatisticsCertificationStatusEnum.NONE
        ? null
        : { ...dimensionsOf(row), round: validityRound(row) },
    (cell) => `${dimensionsKey(cell)}|${cell.round ?? '-'}`,
  )

/** National headcount per status (NONE excluded), withheld below the cohort floor. */
export const employeesByStatus = (
  rows: readonly CompanyStatisticsRow[],
  minimumCohort = MINIMUM_COHORT,
): StatisticsEmployeesDto[] =>
  Object.values(StatisticsCertificationStatusEnum)
    .filter((status) => status !== StatisticsCertificationStatusEnum.NONE)
    .map((status) => {
      const headcounts = rows
        .filter((row) => certificationStatus(row) === status)
        .map((row) => headcountFor(row, status))
        .filter((value): value is number => value !== null)

      return {
        status,
        employees:
          headcounts.length < minimumCohort
            ? null
            : headcounts.reduce((sum, value) => sum + value, 0),
      }
    })

/** The next 00:00 UTC after `date`, i.e. midnight in Iceland. */
export const nextUtcMidnight = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  )
