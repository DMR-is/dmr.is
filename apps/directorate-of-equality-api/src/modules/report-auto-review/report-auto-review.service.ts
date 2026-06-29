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
import {
  AUTO_REVIEW_LOGGING_CONTEXT,
  AUTO_REVIEW_THRESHOLDS,
} from './report-auto-review.constants'
import {
  AutoReviewSignals,
  AutoReviewVerdict,
  IReportAutoReviewService,
} from './report-auto-review.service.interface'

const LOGGING_CONTEXT = AUTO_REVIEW_LOGGING_CONTEXT

const fmtPercent = (value: number): string => `${Math.round(value * 10) / 10}%`

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
    }
  }

  /**
   * Absolute male/female base-pay gap percent from the persisted result
   * snapshot. Absolute because the magnitude of the gap is what matters, not
   * its direction. Null when no result row exists or the metric is uncomputable
   * (e.g. a cohort is empty).
   */
  private async readGapPercent(reportId: string): Promise<number | null> {
    const result = await this.reportResultModel.findOne({
      where: { reportId },
    })
    const maleFemale = result?.baseSnapshot?.totals?.salaryDifferences?.maleFemale
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
   * PROVISIONAL decision rule. No outliers → auto-approve. With outliers, the
   * report still auto-approves only if the outlier share and pay gap are within
   * the configured bounds and the gap did not worsen versus the last approved
   * report; otherwise it is routed to manual review with the failing reasons.
   * Replace this body (not its callers) when the real criteria land.
   */
  private decide(signals: AutoReviewSignals): AutoReviewVerdict {
    const { maxOutlierRatio, maxGapPercent } = AUTO_REVIEW_THRESHOLDS

    if (signals.outlierEmployees === 0) {
      return {
        decision: AutoReviewDecisionEnum.AUTO_APPROVE,
        reason: 'Engin frávik greind — uppfyllir skilyrði sjálfvirkrar samþykktar.',
        signals,
      }
    }

    const failures: string[] = []

    if (signals.outlierRatio !== null && signals.outlierRatio > maxOutlierRatio) {
      failures.push(
        `hlutfall frávika ${fmtPercent(signals.outlierRatio * 100)} yfir mörkum (${fmtPercent(maxOutlierRatio * 100)})`,
      )
    }

    if (signals.gapPercent !== null && signals.gapPercent > maxGapPercent) {
      failures.push(
        `launamunur ${fmtPercent(signals.gapPercent)} yfir mörkum (${fmtPercent(maxGapPercent)})`,
      )
    }

    if (signals.gapImproved === false) {
      failures.push('launamunur jókst frá síðustu samþykktri skýrslu')
    }

    if (failures.length > 0) {
      return {
        decision: AutoReviewDecisionEnum.NEEDS_REVIEW,
        reason: `Krefst yfirferðar: ${failures.join('; ')}.`,
        signals,
      }
    }

    return {
      decision: AutoReviewDecisionEnum.AUTO_APPROVE,
      reason: 'Frávik innan marka — uppfyllir skilyrði sjálfvirkrar samþykktar.',
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
        gapPercent: null,
        previousGapPercent: null,
        gapImproved: null,
      },
    }
  }
}
