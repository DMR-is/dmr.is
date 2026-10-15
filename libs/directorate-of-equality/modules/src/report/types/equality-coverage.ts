import { EqualityCoverageSourceEnum } from '../models/report.enums'
import type { ReportModel } from '../models/report.model'

/**
 * What currently meets a company's equality obligation, resolved once and
 * shared by everything that has to agree about it: `GET reports/equality/active`,
 * `GET reports/salary/eligibility`, and the salary submission itself.
 *
 * Sharing one resolution is the point. The three used to answer from the same
 * query by convention, and the one time they diverged — the submission filtered
 * `parentCompanyId: null` while the two reads did not — a company covered by a
 * group equality report was told it was eligible, handed an id, and then
 * refused. Widening the answer to legacy coverage doubles the number of ways to
 * get that wrong, so the branch lives in exactly one place.
 *
 * A discriminated union rather than a nullable id, because the two cases carry
 * different evidence and neither field is meaningful in the other case: a
 * filed report has an id and no legacy date, a legacy certificate has a date
 * and no id. Reading `legacyValidUntil != null` as "is legacy" would work today
 * and quietly stop working the day anything else sets it.
 */
export type EqualityCoverage =
  | {
      source: EqualityCoverageSourceEnum.REPORT
      /** The APPROVED, in-force equality report the salary will link. */
      report: ReportModel
      legacyValidUntil: null
    }
  | {
      source: EqualityCoverageSourceEnum.LEGACY
      report: null
      /**
       * `legacy_report.equality_valid_until` verbatim — the `YYYY-MM-DD` the
       * old register stated, snapshotted onto the salary report at filing.
       */
      legacyValidUntil: string
    }

/**
 * What a salary report may be filed against: the company's equality coverage,
 * or — when there is none — an exemption from needing it.
 *
 * Kept apart from `EqualityCoverage` on purpose. EXEMPT is not coverage, and
 * `GET reports/equality/active` must keep answering 404 for a municipality
 * with no plan, so the type that route reads cannot have an EXEMPT arm to
 * forget. Only the salary-filing paths read this one.
 */
export type SalaryFilingBasis =
  | EqualityCoverage
  | {
      source: EqualityCoverageSourceEnum.EXEMPT
      report: null
      legacyValidUntil: null
    }
