import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  SalaryAnalysisOutlierDirectionEnum,
  SalaryAnalysisOutlierDto,
  SalaryAnalysisResponseDto,
} from '../../application/dto/salary-analysis.response.dto'
import { CompanyDto } from '../../company/dto/company.dto'
import { IConfigService } from '../../config/config.service.interface'
import {
  type DetectedOutlier,
  detectOutliers,
  resolveAllowedDifferencePercent,
} from '../../report/lib/compensation-aggregates'
import { GenderEnum } from '../../report/models/report.enums'
import { ReportTypeEnum } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from '../../report-statistics/lib/build-chart'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftAnalysisService } from './report-draft-analysis.service.interface'

const LOGGING_CONTEXT = 'ReportDraftAnalysisService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

/** A draft employee with its on-the-fly derived score. */
export type ScoredEmployee = {
  employeeId: string
  ordinal: number
  score: number
  gender: GenderEnum
  workRatio: number
  baseSalary: number
}

/** The salary fields the scoring needs off each employee row. */
type ScorableEmployee = {
  id: string
  ordinal: number
  gender: GenderEnum
  workRatio: number
  baseSalary: number
  reportEmployeeRoleId: string
}

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
      workRatio: employee.workRatio,
      baseSalary: employee.baseSalary,
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

    const scored = await this.deriveScoredEmployees(report.id)
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    const detected = detectOutliers({
      employees: scored.map((e) => ({
        ordinal: e.ordinal,
        score: e.score,
        gender: e.gender,
        workRatio: e.workRatio,
        baseSalary: e.baseSalary,
      })),
      thresholdPercent,
    })

    const chartPoints: EmployeeDataPoint[] = scored.map((e) => ({
      score: e.score,
      adjustedSalary: e.baseSalary / e.workRatio,
      gender: e.gender,
    }))
    const baseSalaryByGenderAndScoreAll = buildChartFromEmployeePoints(
      chartPoints,
      resolveAllowedDifferencePercent(thresholdPercent),
    )

    return {
      outliers: detected.map(toOutlierDto),
      baseSalaryByGenderAndScoreAll,
    }
  }

  async getDetectedOutlierEmployeeIds(
    reportId: string,
  ): Promise<Set<string>> {
    const scored = await this.deriveScoredEmployees(reportId)
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    const detected = detectOutliers({
      employees: scored.map((e) => ({
        ordinal: e.ordinal,
        score: e.score,
        gender: e.gender,
        workRatio: e.workRatio,
        baseSalary: e.baseSalary,
      })),
      thresholdPercent,
    })
    const detectedOrdinals = new Set(detected.map((d) => d.ordinal))

    return new Set(
      scored
        .filter((e) => detectedOrdinals.has(e.ordinal))
        .map((e) => e.employeeId),
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
   * Derives each employee's total score from the persisted scoring graph: the
   * union of the steps assigned to the employee's role and the steps assigned
   * to the employee personally (a step counts once even if reached both ways),
   * summed over the steps' scores. Mirrors `computeEmployeeScores`, but reads
   * the DB join tables instead of a parsed payload.
   */
  private async deriveScoredEmployees(
    reportId: string,
  ): Promise<ScoredEmployee[]> {
    const employees = await this.employeeModel.findAll({
      where: { reportId },
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
    const roleIds = [
      ...new Set(employees.map((e) => e.reportEmployeeRoleId)),
    ]
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
      SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
    )
    const parsed = parseFloat(config.value)

    if (!Number.isFinite(parsed)) {
      throw new InternalServerErrorException(
        `Config entry "${SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY}" must be numeric`,
      )
    }

    return parsed
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

function toOutlierDto(detected: DetectedOutlier): SalaryAnalysisOutlierDto {
  // detectOutliers only emits rows where isOutlier=true, guaranteeing a
  // non-null direction and differencePercent.
  const { assessment } = detected

  return {
    employeeOrdinal: detected.ordinal,
    adjustedBaseSalary: Math.round(detected.adjustedBaseSalary),
    predictedBaseSalary: Math.round(detected.predictedBaseSalary),
    scoreBucketRangeFrom: detected.scoreBucketRangeFrom,
    scoreBucketRangeTo: detected.scoreBucketRangeTo,
    direction:
      (assessment.direction as SalaryAnalysisOutlierDirectionEnum | null) ??
      SalaryAnalysisOutlierDirectionEnum.EQUAL,
    differencePercent: assessment.differencePercent ?? 0,
    allowedDifferencePercent: assessment.allowedDifferencePercent,
  }
}
