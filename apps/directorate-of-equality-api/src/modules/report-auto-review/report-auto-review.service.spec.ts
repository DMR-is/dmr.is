import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { ReportAutoReviewService } from './report-auto-review.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const REPORT_ID = 'report-1'
const PREVIOUS_REPORT_ID = 'report-0'

// Builds a persisted-result row exposing just the male/female gap on reglulegt
// tímakaup that the evaluator reads.
//
// ⚠️ The path below must match `readGapPercent` exactly. Every hop there is
// optional-chained, so a stale path yields `null`, which SKIPS the gap check
// instead of failing it — see the non-null regression test at the end of this
// file, which exists to catch precisely that.
/**
 * A `report_result` row as the service reads it: the unadjusted cohort-mean gap
 * off `salarySnapshot`, plus the frozen decomposition.
 *
 * `oskyrtAvailable` defaults to `true` because that is the ordinary case; the
 * fail-closed tests pass `false` explicitly. Note it must be a real boolean and
 * not left absent — `undefined` reads as `null`, which means "never asked" and
 * deliberately does NOT trip the gate.
 */
const resultRow = (
  maleFemale: number | null,
  decomposition: {
    oskyrtAvailable?: boolean
    oskyrtPercent?: number | null
    minimumSetSize?: number
    minimumSetClosesGap?: boolean
    oskyrtWithinBenchmark?: boolean
  } = {},
) => {
  const minimumSetSize = decomposition.minimumSetSize ?? 0
  return {
    salarySnapshot: { totals: { salaryDifferences: { maleFemale } } },
    wageGapDecompositionSnapshot: {
      oskyrtAvailable: decomposition.oskyrtAvailable ?? true,
      oskyrtPercent: decomposition.oskyrtPercent ?? 2.5,
      minimumSetSize,
      // An empty set is the ordinary compliant case, so it defaults to closing
      // the gap. The exhaustion case — empty set that does NOT close it — is
      // passed explicitly, because it is the one that used to auto-approve.
      minimumSetClosesGap:
        decomposition.minimumSetClosesGap ?? minimumSetSize === 0,
      // ⚠️ Defaulted FROM the set size only because these fixtures were written
      // when the two were equivalent. They are not in general: the walk can
      // decline a candidate that would push the gap further out, so an empty set
      // on a non-compliant company is reachable. That case is passed explicitly
      // — see 'refuses to auto-approve an empty set that is still over the
      // benchmark', which is the whole reason this field exists.
      oskyrtWithinBenchmark:
        decomposition.oskyrtWithinBenchmark ?? minimumSetSize === 0,
    },
  }
}

describe('ReportAutoReviewService', () => {
  let service: ReportAutoReviewService
  let reportFindOne: jest.Mock
  let resultFindOne: jest.Mock
  let employeeCount: jest.Mock
  let outlierCount: jest.Mock

  beforeEach(async () => {
    reportFindOne = jest.fn()
    resultFindOne = jest.fn()
    employeeCount = jest.fn()
    outlierCount = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportAutoReviewService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne },
        },
        {
          provide: getModelToken(ReportResultModel),
          useValue: { findOne: resultFindOne },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { count: employeeCount },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: { count: outlierCount },
        },
      ],
    }).compile()

    service = module.get(ReportAutoReviewService)
  })

  // Arranges a salary report with `total` employees, `outliers` flagged, a
  // current male/female gap, and optionally a previous approved report + gap.
  const arrangeSalary = (opts: {
    total: number
    outliers: number
    gap: number | null
    previousGap?: number | null
    /** Fail-closed gate input. Omit for the ordinary computable case. */
    oskyrtAvailable?: boolean
    /**
     * The FROZEN set size, which is what the decision reads. Defaults to
     * `outliers` so a test saying "N outliers" still means "a set of N"; pass it
     * explicitly to make the row count and the snapshot disagree on purpose.
     */
    minimumSetSize?: number
    minimumSetClosesGap?: boolean
    /**
     * THE compliance input. Defaults to `minimumSetSize === 0`, which is what
     * these fixtures assumed while the two were equivalent; pass it explicitly
     * to express an empty set on a company that is still over the benchmark.
     */
    oskyrtWithinBenchmark?: boolean
  }) => {
    reportFindOne.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
      companyNationalId: '5500000000',
    })
    employeeCount.mockResolvedValue(opts.total)
    outlierCount.mockResolvedValue(opts.outliers)

    // ⚠️ Keyed on reportId, NOT on call order. The service reads `report_result`
    // more than once per decision (the gap, the previous report's gap, the
    // decomposition), and `mockResolvedValueOnce` chains silently returned
    // `undefined` for any read added later — which is how the decomposition went
    // untested when it was first wired in.
    const current = resultRow(opts.gap, {
      oskyrtAvailable: opts.oskyrtAvailable,
      minimumSetSize: opts.minimumSetSize ?? opts.outliers,
      minimumSetClosesGap: opts.minimumSetClosesGap,
      oskyrtWithinBenchmark: opts.oskyrtWithinBenchmark,
    })
    const previous =
      opts.previousGap === undefined ? null : resultRow(opts.previousGap)

    resultFindOne.mockImplementation(
      ({ where }: { where: { reportId: string } }) =>
        Promise.resolve(
          where.reportId === PREVIOUS_REPORT_ID ? previous : current,
        ),
    )

    if (opts.previousGap === undefined) {
      // No previous approved report.
      reportFindOne.mockResolvedValueOnce(null)
    } else {
      reportFindOne.mockResolvedValueOnce({ id: PREVIOUS_REPORT_ID })
    }
  }

  it('abstains (NEEDS_REVIEW) for EQUALITY reports without touching salary signals', async () => {
    reportFindOne.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
    })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.reportType).toBe(ReportTypeEnum.EQUALITY)
    expect(employeeCount).not.toHaveBeenCalled()
    expect(outlierCount).not.toHaveBeenCalled()
  })

  it('abstains when the report cannot be found', async () => {
    reportFindOne.mockResolvedValueOnce(null)

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
  })

  it('auto-approves a salary report with no outliers', async () => {
    arrangeSalary({ total: 20, outliers: 0, gap: 0 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
    expect(verdict.signals.outlierEmployees).toBe(0)
  })

  // ── The rule is now: any outstanding correction needs a human ─────────────
  //
  // These replace six tests that exercised `maxOutlierRatio` / `maxGapPercent` /
  // `gapImproved`. Two of those would still have PASSED against this rule while
  // asserting the wrong reason — they set `outliers: 1`, which routes to review
  // regardless of any gap threshold — so they are rewritten rather than deleted.

  it('routes to review whenever the lágmarksmengi is non-empty', async () => {
    // One correction outstanding is enough: a non-empty set IS "óskýrt exceeds
    // the benchmark", so an úrbótaáætlun is owed and a human judges it.
    arrangeSalary({ total: 20, outliers: 1, gap: 3 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.reason).toMatch(/Óskýrður launamunur er yfir viðmiði/)
  })

  // ⚠️ The regression this rule exists to prevent. Under the retired thresholds
  // a company far over the benchmark auto-approved whenever the gap was carried
  // by few enough people — the lágmarksmengi is MINIMAL by construction, so a
  // small set means a concentrated problem, not a small one. 4 of 200 passed a
  // 10% ratio test comfortably.
  it('routes to review even when the flagged share is tiny', async () => {
    arrangeSalary({ total: 200, outliers: 4, gap: 4.5 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.outlierRatio).toBeCloseTo(0.02)
  })

  // ⚠️ The other half: the unadjusted cohort-mean gap has NO compliance role and
  // moves independently of óskýrt. It must not be able to force review on its
  // own, nor to excuse it.
  it('ignores the unadjusted gap entirely', async () => {
    // A large raw gap with nothing outstanding still auto-approves...
    arrangeSalary({ total: 20, outliers: 0, gap: 20 })
    expect((await service.evaluate(REPORT_ID)).decision).toBe(
      AutoReviewDecisionEnum.AUTO_APPROVE,
    )

    // ...and a tiny raw gap with something outstanding still needs review.
    arrangeSalary({ total: 20, outliers: 1, gap: 0.1 })
    expect((await service.evaluate(REPORT_ID)).decision).toBe(
      AutoReviewDecisionEnum.NEEDS_REVIEW,
    )
  })

  // `gapImproved` is still recorded for the audit trail, but no longer decides:
  // last year being worse does not discharge corrections owed now.
  it('records gapImproved without letting it decide', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 3, previousGap: 5 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.signals.gapImproved).toBe(true)
    expect(verdict.signals.previousGapPercent).toBe(5)
    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
  })

  it('still records the absolute unadjusted gap in the signals', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: -8 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.signals.gapPercent).toBe(8)
  })

  /**
   * Guards a failure mode that is invisible by construction.
   *
   * `readGapPercent` walks `result.salarySnapshot.totals.salaryDifferences
   * .maleFemale` with optional chaining at every hop. If that path ever goes
   * stale — a renamed column, a re-nested snapshot — it returns `null`, and
   * `decide()` *skips* the gap condition rather than reporting a problem. The
   * report then auto-approves on a number nobody read.
   *
   * Nothing else catches it: the type is `number | null`, `null` is a legitimate
   * value (an empty cohort has no gap), and every other assertion in this file
   * would still pass. It is masked in production today only because
   * `AUTO_REVIEW_ENFORCE` is false — meaning it would first bite on the day
   * enforcement is switched on, which is exactly when the wage-gap benchmark
   * lands.
   *
   * So: assert the value is actually read, not merely that a decision came back.
   */
  // ── Fail-closed gate ──────────────────────────────────────────────────────
  //
  // Confirmed with Þórður 2026-08-20: an unmeasurable gap goes to a human.

  /**
   * The exhaustion case, and the reason the decision reads
   * `oskyrtWithinBenchmark` rather than `minimumSetSize === 0`.
   *
   * An empty lágmarksmengi now has THREE causes, and only the first is
   * compliance:
   *
   * 1. óskýrt is already inside the benchmark — nothing to correct.
   * 2. Nobody on the disadvantaged side is underpaid, so there was nothing to
   *    lift.
   * 3. Every candidate's correction would have pushed óskýrt FURTHER out, so
   *    the two-directional walk declined all of them.
   *
   * Keyed on set size, cases 2 and 3 auto-approve — a company approved
   * BECAUSE the walk found nobody worth correcting. Keyed on the flag, they
   * route to a human.
   */
  it('routes to review for an empty set that does not close the gap', async () => {
    arrangeSalary({
      total: 20,
      outliers: 0,
      gap: 2,
      minimumSetSize: 0,
      minimumSetClosesGap: false,
      // Explicit: the builder would otherwise infer compliance from the empty
      // set, which is the inference this test exists to disprove.
      oskyrtWithinBenchmark: false,
    })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.minimumSetSize).toBe(0)
    expect(verdict.signals.minimumSetClosesGap).toBe(false)
    expect(verdict.signals.oskyrtWithinBenchmark).toBe(false)
  })

  /**
   * The decision must follow the FROZEN snapshot, not the
   * `report_employee_outlier` row count. The two are computed from different
   * inputs — unrounded payload floats on the create path versus DECIMAL-rounded
   * rows for the snapshot — so they can disagree, and the reviewer's card reads
   * the snapshot. Keying on the row count let the verdict and the displayed
   * figure diverge.
   */
  it('follows the snapshot, not the outlier row count, when they disagree', async () => {
    // Row count says clean; the frozen snapshot says three must be accounted for.
    arrangeSalary({
      total: 20,
      outliers: 0,
      gap: 2,
      minimumSetSize: 3,
      minimumSetClosesGap: true,
    })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.outlierEmployees).toBe(0)
    expect(verdict.signals.minimumSetSize).toBe(3)
  })

  it('routes to review when óskýrt could not be computed, even with zero outliers', async () => {
    // ⚠️ THE ordering test. A single-gender company has an empty lágmarksmengi,
    // so `outlierEmployees` is 0 — and the zero-outlier branch would
    // auto-approve it. That would approve a company BECAUSE its gap could not be
    // measured. The gate must be evaluated first, so this asserts the outcome
    // that only holds if it is.
    arrangeSalary({ total: 20, outliers: 0, gap: null, oskyrtAvailable: false })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.reason).toMatch(/Ekki var unnt að reikna óskýrðan launamun/)
    expect(verdict.signals.outlierEmployees).toBe(0)
    expect(verdict.signals.oskyrtAvailable).toBe(false)
  })

  it('does not trip the gate when óskýrt is computable', async () => {
    arrangeSalary({ total: 20, outliers: 0, gap: 1, oskyrtAvailable: true })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
    expect(verdict.signals.oskyrtAvailable).toBe(true)
  })

  // `null` means "never asked" — an EQUALITY report, or no result row yet — and
  // must NOT read as "we tried and failed". Abstention already routes those to a
  // human via its own path, with its own reason.
  it('abstains with a null availability rather than citing the gap gate', async () => {
    reportFindOne.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
    })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.decision).toBe(AutoReviewDecisionEnum.NEEDS_REVIEW)
    expect(verdict.signals.oskyrtAvailable).toBeNull()
    expect(verdict.reason).not.toMatch(/óskýrðan launamun/)
  })

  it('records leiðréttur launamunur in the audit signals', async () => {
    arrangeSalary({ total: 20, outliers: 0, gap: 1 })

    const verdict = await service.evaluate(REPORT_ID)

    // Recorded but NOT yet a decision input — the thresholds still carry
    // band-era values. Wiring it is Phase 2.1.
    expect(verdict.signals.adjustedGapPercent).toBe(2.5)
    expect(verdict.decision).toBe(AutoReviewDecisionEnum.AUTO_APPROVE)
  })

  it('reads a real gap percent rather than silently skipping the check', async () => {
    arrangeSalary({ total: 20, outliers: 1, gap: 3 })

    const verdict = await service.evaluate(REPORT_ID)

    expect(verdict.signals.gapPercent).not.toBeNull()
    expect(verdict.signals.gapPercent).toBe(3)
  })
})
