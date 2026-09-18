import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import { AUTO_REVIEW_LOGGING_CONTEXT } from './report-auto-review.constants'
import {
  AutoReviewSignals,
  AutoReviewVerdict,
  IReportAutoReviewService,
} from './report-auto-review.service.interface'

const LOGGING_CONTEXT = AUTO_REVIEW_LOGGING_CONTEXT

@Injectable()
export class ReportAutoReviewService implements IReportAutoReviewService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportResultModel)
    private readonly reportResultModel: typeof ReportResultModel,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
  ) {}

  async evaluate(reportId: string): Promise<AutoReviewVerdict> {
    const report = await this.reportModel.findOne({ where: { id: reportId } })

    // Defensive: should never happen — the caller just created the row.
    if (!report) {
      this.logger.warn(
        `Auto-review asked to evaluate missing report ${reportId}`,
        { context: LOGGING_CONTEXT, reportId },
      )
      return this.abstain(
        ReportTypeEnum.SALARY,
        'Skýrsla fannst ekki — krefst handvirkrar yfirferðar.',
      )
    }

    // EQUALITY reports are narrative — there is nothing quantitative to assess
    // yet, so the system abstains and routes them to a human.
    if (report.type !== ReportTypeEnum.SALARY) {
      return this.abstain(
        report.type,
        'Jafnlaunaskýrslur eru ekki metnar sjálfvirkt — krefst handvirkrar yfirferðar.',
      )
    }

    const signals = await this.collectSalarySignals(report)
    return this.decide(signals)
  }

  /** Gathers the salary-report inputs the decision rule reads. */
  private async collectSalarySignals(
    report: ReportModel,
  ): Promise<AutoReviewSignals> {
    const totalEmployees = await this.reportEmployeeModel.count({
      where: { reportId: report.id },
    })

    const outlierEmployees = await this.reportEmployeeOutlierModel.count({
      include: [
        {
          model: ReportEmployeeModel,
          as: 'reportEmployee',
          where: { reportId: report.id },
          required: true,
        },
      ],
    })

    const gapPercent = await this.readGapPercent(report.id)
    const previousGapPercent = await this.readPreviousGapPercent(report)
    const decomposition = await this.readDecomposition(report.id)

    const outlierRatio =
      totalEmployees > 0 ? outlierEmployees / totalEmployees : null

    const gapImproved =
      gapPercent !== null && previousGapPercent !== null
        ? gapPercent < previousGapPercent
        : null

    return {
      reportType: ReportTypeEnum.SALARY,
      totalEmployees,
      outlierEmployees,
      outlierRatio,
      gapPercent,
      previousGapPercent,
      gapImproved,
      oskyrtAvailable: decomposition?.oskyrtAvailable ?? null,
      adjustedGapPercent: decomposition?.oskyrtPercent ?? null,
      minimumSetSize: decomposition?.minimumSetSize ?? null,
      minimumSetClosesGap: decomposition?.minimumSetClosesGap ?? null,
      oskyrtWithinBenchmark: decomposition?.oskyrtWithinBenchmark ?? null,
    }
  }

  /**
   * The frozen decomposition, or null when the report has no result row.
   *
   * Read as a whole rather than through a narrow accessor because two of its
   * fields are needed and one of them — `oskyrtAvailable` — decides an outcome.
   */
  private async readDecomposition(reportId: string) {
    const result = await this.reportResultModel.findOne({ where: { reportId } })
    return result?.wageGapDecompositionSnapshot ?? null
  }

  /**
   * Absolute male/female gap percent on reglulegt tímakaup, from the persisted
   * result snapshot. Absolute because the magnitude of the gap is what matters,
   * not its direction. Null when no result row exists or the metric is
   * uncomputable (e.g. a cohort is empty).
   *
   * ⚠️ **Every access below is optional-chained, so a wrong path here reads as
   * `null` and silently SKIPS the gap check in `decide()` rather than failing.**
   * That would auto-approve reports which should route to `NEEDS_REVIEW` — and
   * it is currently masked by `AUTO_REVIEW_ENFORCE = false`, so it would only
   * surface in production the day enforcement is switched on. The rename from
   * `baseSnapshot` to `salarySnapshot` turned that into a compile error once;
   * it will not do so again if a future field is merely re-nested. There is a
   * regression test asserting this returns non-null for a computable report —
   * keep it.
   *
   * NB: this is the *unadjusted* cohort-mean gap, unchanged in meaning by the
   * move to hourly. It is not the Oaxaca-Blinder unexplained term that the
   * 3,9% benchmark will test — that arrives with the decomposition snapshot.
   */
  private async readGapPercent(reportId: string): Promise<number | null> {
    const result = await this.reportResultModel.findOne({
      where: { reportId },
    })
    const maleFemale =
      result?.salarySnapshot?.totals?.salaryDifferences?.maleFemale
    return maleFemale === null || maleFemale === undefined
      ? null
      : Math.abs(maleFemale)
  }

  /**
   * The same gap metric on the company's most recent *approved* salary report,
   * so the rule can ask "did the gap improve since last time?". Matched on the
   * company national id the report was filed under.
   */
  private async readPreviousGapPercent(
    report: ReportModel,
  ): Promise<number | null> {
    const previous = await this.reportModel.findOne({
      where: {
        companyNationalId: report.companyNationalId,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.APPROVED,
        id: { [Op.ne]: report.id },
      },
      order: [['approvedAt', 'DESC']],
    })
    if (!previous) return null
    return this.readGapPercent(previous.id)
  }

  /**
   * The decision rule.
   *
   * Three branches, and the middle one carries all the weight: the report is
   * compliant iff the frozen snapshot says óskýrt is within the benchmark.
   *
   * ⚠️ **Tests the FLAG, never the size of the set.** The two used to coincide,
   * and the reason they did is worth keeping because it explains why they stopped:
   * the reference is a least-squares fit through the whole workforce, so óskýrt ≠ 0
   * forces the disadvantaged cohort's residuals to sum against it and at least one
   * member always sat below the line — the pool was never empty, so a lift-only
   * walk always committed someone. That was a property of the fit, not of this
   * rule. The two-directional walk probes before committing and DECLINES a
   * candidate that would push the gap further out, so an empty set on a company
   * over the benchmark is now reachable and `minimumSetSize === 0` would
   * auto-approve it.
   *
   * The size also cannot say WHY the walk stopped — landing inside the benchmark
   * and declining every candidate look identical from a count of zero.
   *
   * ⚠️ **Read off the SNAPSHOT, not `outlierEmployees`.** That signal is a
   * `COUNT(*)` over `report_employee_outlier` rows written by the create-path
   * decomposition, which is computed from unrounded payload floats while the
   * snapshot is computed from `DECIMAL`-rounded rows. The two can disagree, and
   * the reviewer's card reads the snapshot — so keying the decision on the row
   * count let the decision and the displayed figure diverge.
   *
   * ⚠️ **This deliberately no longer consults `outlierRatio`, `gapPercent` or
   * `gapImproved`.** All three are still collected for the audit trail, and they
   * are useful context for a reviewer, but as *decision inputs* they overrode a
   * correct answer with a wrong one:
   *
   * - `outlierRatio` measured severity under the ±band. The lágmarksmengi is
   *   minimal by construction, so a small set can mean a CONCENTRATED problem
   *   rather than a small one. A cohort 49% over the benchmark passed at 4/200.
   * - `gapPercent` is the unadjusted cohort-mean gap, which has no compliance
   *   role and moves independently of óskýrt in both directions.
   * - `gapImproved` asked whether last year was worse. Irrelevant when
   *   corrections are outstanding now.
   *
   * The consequence of exceeding is **NEEDS_REVIEW**, never rejection: the
   * regulation obliges an *áætlun um úrbætur*, and every rejection stays manual.
   * `AUTO_REVIEW_ENFORCE` gates whether any of this acts at all.
   */
  private decide(signals: AutoReviewSignals): AutoReviewVerdict {
    // Fail closed on an unmeasurable gap. MUST precede the zero-outlier branch:
    // a single-gender company has an empty lágmarksmengi, so that branch would
    // auto-approve it — approving a company BECAUSE its gap could not be
    // measured.
    if (signals.oskyrtAvailable === false) {
      return {
        decision: AutoReviewDecisionEnum.NEEDS_REVIEW,
        reason:
          'Ekki var unnt að reikna óskýrðan launamun — krefst handvirkrar yfirferðar.',
        signals,
      }
    }

    // ⚠️ Keyed on the compliance flag, not on `minimumSetSize === 0`. The two
    // used to be equivalent; they are not now that the walk can decline a
    // candidate rather than commit one that widens the gap, which makes an
    // empty set reachable on a company that is over the benchmark. Size cannot
    // say WHY the walk stopped — the flag can.
    if (signals.oskyrtWithinBenchmark === true) {
      return {
        decision: AutoReviewDecisionEnum.AUTO_APPROVE,
        reason:
          'Óskýrður launamunur er undir viðmiði — engar úrbætur nauðsynlegar.',
        signals,
      }
    }

    // ⚠️ An empty set here does NOT mean there is nothing to look at. This
    // branch is now reachable with `minimumSetSize === 0` — the walk declined
    // every candidate — and "0 starfsmenn í úrbótaáætlun krefjast yfirferðar"
    // would read as though nothing needs attention on precisely the report where
    // the gap is live and nobody has been named for it. This string is the audit
    // trail a reviewer reads first, so it says which of the two states it is.
    const size = signals.minimumSetSize ?? 0
    // Icelandic agrees with the last digit: 1 and 21 take the singular, 11 does
    // not. Cheaper to get right here than to leave "starfsmaður/starfsmenn" in a
    // reviewer-facing string.
    const singular = size % 10 === 1 && size % 100 !== 11

    return {
      decision: AutoReviewDecisionEnum.NEEDS_REVIEW,
      reason:
        size === 0
          ? 'Óskýrður launamunur er yfir viðmiði en ekkert lágmarksmengi náði að loka honum — skýrslan krefst yfirferðar.'
          : `Óskýrður launamunur er yfir viðmiði — ${size} ${singular ? 'starfsmaður' : 'starfsmenn'} í úrbótaáætlun ${singular ? 'krefst' : 'krefjast'} yfirferðar.`,
      signals,
    }
  }

  private abstain(
    reportType: ReportTypeEnum,
    reason: string,
  ): AutoReviewVerdict {
    return {
      decision: AutoReviewDecisionEnum.NEEDS_REVIEW,
      reason,
      signals: {
        reportType,
        totalEmployees: 0,
        outlierEmployees: 0,
        outlierRatio: null,
        minimumSetSize: null,
        minimumSetClosesGap: null,
        gapPercent: null,
        previousGapPercent: null,
        gapImproved: null,
        // `null`, not `false`: abstaining means the question was never asked, so
        // this must not read as "we tried and could not measure it".
        oskyrtAvailable: null,
        oskyrtWithinBenchmark: null,
        adjustedGapPercent: null,
      },
    }
  }
}
