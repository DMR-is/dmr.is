import { CompanySectorEnum } from '../../company/models/company.enums'

/**
 * Sectors that may file a salary report (jafnlaunaskýrsla) without an equality
 * report (jafnréttisáætlun) in force.
 *
 * The rule is the sector and nothing else. Byggðasamlög (Strætó bs., SORPA
 * bs., …) are not exempt: they file on their own and are gated like any other
 * employer. That holds because none of them is SVEITARFELAG — the register
 * files them as FYRIRTAEKI, `LEGAL_FORM_SECTOR` maps an RSK `byggdasamlag` to
 * FYRIRTAEKI, and m-20261016 moved the rows m-20260915 had put in
 * SVEITARFELAG.
 *
 * Sveitarfélög are under a different rule from every other employer: their
 * salary report is not gated on the state of their equality report. Every
 * other sector, UNKNOWN included, still has to be covered by an APPROVED
 * report or an unexpired legacy certificate. A municipality RSK has not
 * classified yet reads UNKNOWN and is gated until an admin sets its sector.
 *
 * A group filing is judged on the submitting (parent) company alone, as it
 * always has been, so a municipality's subsidiaries in the filing — a municipal
 * ehf., say — are exempt along with it. That is intended.
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
