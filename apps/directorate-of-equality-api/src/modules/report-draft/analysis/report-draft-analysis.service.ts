import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { IConfigService } from '../../config/config.service.interface'
import {
  CONFIG_KEYS,
  parseNumericConfig,
} from '../../config/lib/numeric-config'
import {
  getRegularHourlyWage,
  type RegularHourlyWageInput,
} from '../../report/lib/compensation-aggregates'
import {
  computeWageGapDecomposition,
  roundWageGapDecompositionSnapshot,
  type WageGapDecompositionSnapshot,
  type WageGapEmployeeInput,
} from '../../report/lib/wage-gap-decomposition'
import { GenderEnum } from '../../report/models/report.enums'
import { ReportTypeEnum } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { SalaryAnalysisResponseDto } from '../../report-statistics/dto/salary-analysis.response.dto'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from '../../report-statistics/lib/build-chart'
import {
  selectMinimumSet,
  toMinimumSetDtos,
} from '../../report-statistics/lib/minimum-set'
import { computePayDispersion } from '../../report-statistics/lib/pay-dispersion'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftAnalysisService } from './report-draft-analysis.service.interface'

const LOGGING_CONTEXT = 'ReportDraftAnalysisService'
/** A draft employee with its on-the-fly derived score. */
export type ScoredEmployee = {
  employeeId: string
  ordinal: number
  score: number
  gender: GenderEnum
  /** Starf. Null when the row's role association was not loaded or is missing. */
  roleTitle: string | null
} & RegularHourlyWageInput

/** The salary fields the scoring needs off each employee row. */
type ScorableEmployee = {
  id: string
  ordinal: number
  gender: GenderEnum
  reportEmployeeRoleId: string
  /** Loaded `role` association, when the caller eager-loaded it. */
  role?: { title: string } | null
} & RegularHourlyWageInput

/**
 * Pure scoring: each employee's total = sum over the UNION of the steps
 * assigned to its role and the steps assigned to it personally (a step counts
 * once even if reached both ways), using each step's score. A step id absent
 * from `stepScoreById` contributes 0. Mirrors `computeEmployeeScores` for the
 * DB-state (rather than parsed-payload) case.
 */
export function deriveEmployeeScores(
  employees: ScorableEmployee[],
  stepScoreById: Map<string, number>,
  stepIdsByRole: Map<string, string[]>,
  stepIdsByEmployee: Map<string, string[]>,
): ScoredEmployee[] {
  return employees.map((employee) => {
    const applicable = new Set<string>([
      ...(stepIdsByRole.get(employee.reportEmployeeRoleId) ?? []),
      ...(stepIdsByEmployee.get(employee.id) ?? []),
    ])
    let score = 0
    for (const stepId of applicable) {
      score += stepScoreById.get(stepId) ?? 0
    }

    return {
      employeeId: employee.id,
      ordinal: employee.ordinal,
      score,
      gender: employee.gender,
      roleTitle: employee.role?.title ?? null,
      paidHours: employee.paidHours,
      baseSalary: employee.baseSalary,
      additionalSalary: employee.additionalSalary,
      bonusSalary: employee.bonusSalary,
    }
  })
}

@Injectable()
export class ReportDraftAnalysisService implements IReportDraftAnalysisService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IConfigService) private readonly configService: IConfigService,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportCriterionModel)
    private readonly criterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly subCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly stepModel: typeof ReportSubCriterionStepModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
  ) {}

  async analyzeDraft(
    providerId: string,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        'Salary analysis is only available for salary reports',
      )
    }

    this.logger.debug('Deriving draft salary analysis', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    const { scored, decomposition } = await this.decomposeDraft(report.id)

    // The chart, from the same rows. Descriptive only — no tolerance band,
    // because no per-employee band decides anything now.
    const chartPoints: EmployeeDataPoint[] = scored.map((e) => ({
      score: e.score,
      regularHourlyWage: getRegularHourlyWage(e),
      gender: e.gender,
    }))

    const roleTitleByOrdinal = new Map<number, string | null>(
      scored.map((e) => [e.ordinal, e.roleTitle]),
    )

    return {
      outliers: toMinimumSetDtos(decomposition, roleTitleByOrdinal),
      regularHourlyWageByScoreAll: buildChartFromEmployeePoints(chartPoints),
      wageGapDecomposition: decomposition,
      // Ábendingar — informational, no obligation. Derived from the same
      // decomposition, so a draft preview and the frozen result cannot disagree.
      payDispersion: computePayDispersion(decomposition),
    }
  }

  /**
   * The employees the úrbótaáætlun must account for: the **lágmarksmengi**.
   *
   * ⚠️ This used to be the ±1,95% band around a fitted line, evaluated per
   * employee. It is now membership of the smallest set of corrections that
   * brings óskýrt under the benchmark — see `selectMinimumSet` for why that is
   * a property of the set rather than of the person.
   *
   * Consequences for the callers (submit and sync), neither of which changes:
   * an already-compliant company returns an EMPTY set and so needs no
   * úrbótaáætlun at all, and the set is two-directional, so an id returned here
   * may belong to someone paid ABOVE their stig. Membership is all the callers
   * need; direction is carried on the snapshot for the copy to read.
   */
  async getDetectedOutlierEmployeeIds(reportId: string): Promise<Set<string>> {
    const { scored, decomposition } = await this.decomposeDraft(reportId)
    const flagged = new Set(
      selectMinimumSet(decomposition).map((e) => e.ordinal),
    )

    return new Set(
      scored.filter((e) => flagged.has(e.ordinal)).map((e) => e.employeeId),
    )
  }

  async persistScores(reportId: string): Promise<void> {
    const scored = await this.deriveScoredEmployees(reportId)

    // Freeze each derived score onto the employee row. Bounded by employee
    // count and only runs once, at submit; runs in the CLS request transaction.
    for (const employee of scored) {
      await this.employeeModel.update(
        { score: employee.score },
        { where: { id: employee.employeeId } },
      )
    }

    this.logger.info(`Persisted ${scored.length} employee score(s)`, {
      context: LOGGING_CONTEXT,
      reportId,
    })
  }

  /**
   * Scores the draft's employees and decomposes the gap over them, in one place
   * so `analyzeDraft` (what the applicant sees) and
   * `getDetectedOutlierEmployeeIds` (what submit enforces) can never disagree
   * about who is in the lágmarksmengi.
   *
   * Rounded with the persistence defaults, matching `report-result.service.ts`,
   * so the previewed figure is the one frozen at submit.
   */
  private async decomposeDraft(reportId: string): Promise<{
    scored: ScoredEmployee[]
    decomposition: WageGapDecompositionSnapshot
  }> {
    const scored = await this.deriveScoredEmployees(reportId)
    const benchmarkPercent = await this.getSalaryDifferenceThresholdPercent()

    const employees: WageGapEmployeeInput[] = scored.map((e) => ({
      ordinal: e.ordinal,
      score: e.score,
      gender: e.gender,
      hourlyWage: getRegularHourlyWage(e),
    }))

    return {
      scored,
      decomposition: roundWageGapDecompositionSnapshot(
        computeWageGapDecomposition({ employees, benchmarkPercent }),
      ),
    }
  }

  /**
   * Derives each employee's total score from the persisted scoring graph: the
   * union of the steps assigned to the employee's role and the steps assigned
   * to the employee personally (a step counts once even if reached both ways),
   * summed over the steps' scores. Mirrors `computeEmployeeScores`, but reads
   * the DB join tables instead of a parsed payload.
   */
  private async deriveScoredEmployees(
    reportId: string,
  ): Promise<ScoredEmployee[]> {
    // Ordered so the lágmarksmengi is a pure function of the data. The
    // selection walk breaks |contributionLog| ties by ordinal, which only
    // helps if the rows arrive in a stable order — an unordered findAll lets
    // Postgres heap order decide, and it can differ between the preview
    // request and the submit request for the same report.
    const employees = await this.employeeModel.findAll({
      where: { reportId },
      order: [['ordinal', 'ASC']],
      // Starf, for the `roleTitle` denormalised onto each outlier row. Eager-
      // loaded here rather than fetched by the client from `/draft/roles`,
      // because the report states that surface this analysis are not all
      // granted the draft role/employee reads.
      include: [
        {
          model: ReportEmployeeRoleModel,
          as: 'role',
          attributes: ['id', 'title'],
          required: false,
        },
      ],
    })
    if (employees.length === 0) {
      return []
    }

    // step id → score, for every step belonging to the report's criteria tree.
    const criteria = await this.criterionModel.findAll({
      where: { reportId },
      attributes: ['id'],
    })
    const criterionIds = criteria.map((c) => c.id)
    const subs = criterionIds.length
      ? await this.subCriterionModel.findAll({
          where: { reportCriterionId: criterionIds },
          attributes: ['id'],
        })
      : []
    const subIds = subs.map((s) => s.id)
    const steps = subIds.length
      ? await this.stepModel.findAll({
          where: { reportSubCriterionId: subIds },
          attributes: ['id', 'score'],
        })
      : []
    const stepScoreById = new Map(steps.map((s) => [s.id, s.score]))

    // role id → assigned step ids
    const roleIds = [...new Set(employees.map((e) => e.reportEmployeeRoleId))]
    const roleStepRows = roleIds.length
      ? await this.roleStepModel.findAll({
          where: { reportEmployeeRoleId: roleIds },
        })
      : []
    const stepsByRole = groupBy(
      roleStepRows,
      (row) => row.reportEmployeeRoleId,
      (row) => row.reportSubCriterionStepId,
    )

    // employee id → assigned personal step ids
    const employeeIds = employees.map((e) => e.id)
    const personalRows = await this.personalStepModel.findAll({
      where: { reportEmployeeId: employeeIds },
    })
    const stepsByEmployee = groupBy(
      personalRows,
      (row) => row.reportEmployeeId,
      (row) => row.reportSubCriterionStepId,
    )

    return deriveEmployeeScores(
      employees,
      stepScoreById,
      stepsByRole,
      stepsByEmployee,
    )
  }

  private async getSalaryDifferenceThresholdPercent(): Promise<number> {
    const config = await this.configService.getByKey(
      CONFIG_KEYS.SALARY_DIFFERENCE_THRESHOLD_PERCENT,
    )

    return parseNumericConfig(
      config.value,
      CONFIG_KEYS.SALARY_DIFFERENCE_THRESHOLD_PERCENT,
    )
  }
}

/** Group rows into a `Map<key, value[]>`. */
function groupBy<T, K, V>(
  rows: T[],
  keyOf: (row: T) => K,
  valueOf: (row: T) => V,
): Map<K, V[]> {
  const map = new Map<K, V[]>()
  for (const row of rows) {
    const key = keyOf(row)
    const list = map.get(key)
    if (list) {
      list.push(valueOf(row))
    } else {
      map.set(key, [valueOf(row)])
    }
  }
  return map
}
