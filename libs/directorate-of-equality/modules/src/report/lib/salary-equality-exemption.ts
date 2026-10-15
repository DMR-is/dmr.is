import { CompanySectorEnum } from '../../company/models/company.enums'

/**
 * Sectors that may file a salary report (jafnlaunaskýrsla) without an equality
 * report (jafnréttisáætlun) in force.
 *
 * Sveitarfélög are under a different rule from every other employer: their
 * salary report is not gated on the state of their equality report. Every
 * other sector, UNKNOWN included, still has to be covered by an APPROVED
 * report or an unexpired legacy certificate. A municipality RSK has not
 * classified yet reads UNKNOWN and is gated until an admin sets its sector.
 *
 * This waives the *precondition* only. The equality obligation itself is
 * unchanged — the admin register still tags a municipality without a plan
 * `MISSING_EQUALITY_REPORT`, and `GET reports/equality/active` still 404s.
 */
export const SALARY_EQUALITY_EXEMPT_SECTORS: ReadonlySet<CompanySectorEnum> =
  new Set([CompanySectorEnum.SVEITARFELAG])

export function isExemptFromSalaryEqualityPrecondition(
  sector: CompanySectorEnum | null | undefined,
): boolean {
  return !!sector && SALARY_EQUALITY_EXEMPT_SECTORS.has(sector)
}
