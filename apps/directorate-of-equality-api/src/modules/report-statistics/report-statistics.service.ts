import { Op } from 'sequelize'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  computeSalaryAggregateSnapshot,
  computeSalaryScoreBucketSnapshots,
  computeWageGapPercent,
  getAdjustedBaseSalary,
  getAdjustedFullSalary,
  roundNullable,
  type SalaryScorePoint,
} from '../report/lib/compensation-aggregates'
import { GenderEnum } from '../report/models/report.model'
import {
  ReportCriterionModel,
  ReportCriterionTypeEnum,
} from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import {
  BenefitsBreakdownDto,
  GenderBenefitsDto,
} from './dto/benefits-breakdown.dto'
import { GenderWageGapDto } from './dto/gender-wage-gap.dto'
import {
  RegressionLineDto,
  SalaryByGenderAndScoreDto,
  SalaryTotalsDto,
  ScatterDataPointDto,
  ScoreBucketDto,
} from './dto/salary-by-gender-and-score.dto'
import { IReportStatisticsService } from './report-statistics.service.interface'

const LOGGING_CONTEXT = 'ReportStatisticsService'
const BUCKET_WIDTH = 100

interface EmployeeDataPoint {
  score: number
  adjustedSalary: number
  gender: GenderEnum
}

@Injectable()
export class ReportStatisticsService implements IReportStatisticsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportCriterionModel)
    private readonly reportCriterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly reportSubCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly reportSubCriterionStepModel: typeof ReportSubCriterionStepModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
  ) {}

  async getBaseSalaryByGenderAndScoreAll(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    this.logger.debug('Computing base salary by gender and total score', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const employees = await this.fetchEmployees(reportId)

    const points: EmployeeDataPoint[] = employees.map((e) => ({
      score: e.score,
      adjustedSalary: getAdjustedBaseSalary(e),
      gender: e.gender,
    }))

    return buildChartResponse(points)
  }

  async getBaseSalaryByGenderAndScoreWork(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    this.logger.debug(
      'Computing base salary by gender and work score (excluding PERSONAL)',
      { context: LOGGING_CONTEXT, reportId },
    )

    const employees = await this.fetchEmployees(reportId)
    const workStepScores = await this.getWorkStepScores(reportId)

    const roleIds = [...new Set(employees.map((e) => e.reportEmployeeRoleId))]
    const roleStepsByRole = await this.getRoleStepsByRole(roleIds)

    const employeeIds = employees.map((e) => e.id)
    const personalStepsByEmployee =
      await this.getPersonalStepsByEmployee(employeeIds)

    const points: EmployeeDataPoint[] = employees.map((e) => {
      const workScore = this.computeEmployeeWorkScore(
        e,
        workStepScores,
        roleStepsByRole,
        personalStepsByEmployee,
      )

      return {
        score: workScore,
        adjustedSalary: getAdjustedBaseSalary(e),
        gender: e.gender,
      }
    })

    return buildChartResponse(points)
  }

  async getFullSalaryByGenderAndScoreAll(
    reportId: string,
  ): Promise<SalaryByGenderAndScoreDto> {
    this.logger.debug(
      'Computing full salary (base + additional + bonus) by gender and total score',
      { context: LOGGING_CONTEXT, reportId },
    )

    const employees = await this.fetchEmployees(reportId)

    const points: EmployeeDataPoint[] = employees.map((e) => ({
      score: e.score,
      adjustedSalary: getAdjustedFullSalary(e),
      gender: e.gender,
    }))

    return buildChartResponse(points)
  }

  async getBaseSalaryGenderWageGap(
    reportId: string,
  ): Promise<GenderWageGapDto> {
    this.logger.debug('Computing base salary gender wage gap', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const employees = await this.fetchEmployees(reportId)

    const points: EmployeeDataPoint[] = employees.map((e) => ({
      score: 0,
      adjustedSalary: getAdjustedBaseSalary(e),
      gender: e.gender,
    }))

    return buildWageGapResponse(points)
  }

  async getFullSalaryGenderWageGap(
    reportId: string,
  ): Promise<GenderWageGapDto> {
    this.logger.debug(
      'Computing full salary (base + additional + bonus) gender wage gap',
      { context: LOGGING_CONTEXT, reportId },
    )

    const employees = await this.fetchEmployees(reportId)

    const points: EmployeeDataPoint[] = employees.map((e) => ({
      score: 0,
      adjustedSalary: getAdjustedFullSalary(e),
      gender: e.gender,
    }))

    return buildWageGapResponse(points)
  }

  async getBenefitsBreakdown(
    reportId: string,
  ): Promise<BenefitsBreakdownDto> {
    this.logger.debug(
      'Computing benefits breakdown (additional + bonus) by gender',
      { context: LOGGING_CONTEXT, reportId },
    )

    const employees = await this.fetchEmployees(reportId)

    const rows = employees.map((e) => ({
      bonus: e.bonusSalary ?? 0,
      additional: e.additionalSalary,
      gender: e.gender,
    }))

    const males = rows.filter((r) => r.gender === GenderEnum.MALE)
    const females = rows.filter((r) => r.gender === GenderEnum.FEMALE)

    const build = (group: typeof rows): GenderBenefitsDto => {
      const bonuses = group.map((r) => r.bonus)
      const additionals = group.map((r) => r.additional)
      const totals = group.map((r) => r.bonus + r.additional)

      return {
        averageBonusSalary: Math.round(avg(bonuses)),
        averageAdditionalSalary: Math.round(avg(additionals)),
        averageTotal: Math.round(avg(totals)),
        medianBonusSalary: Math.round(med(bonuses)),
        medianAdditionalSalary: Math.round(med(additionals)),
        medianTotal: Math.round(med(totals)),
        count: group.length,
      }
    }

    const maleData = build(males)
    const femaleData = build(females)
    const overallData = build(rows)

    return {
      male: maleData,
      female: femaleData,
      overall: overallData,
      bonusWageGapPercent: computeWageGap(
        males.length > 0 ? maleData.averageBonusSalary : null,
        females.length > 0 ? femaleData.averageBonusSalary : null,
      ),
      additionalWageGapPercent: computeWageGap(
        males.length > 0 ? maleData.averageAdditionalSalary : null,
        females.length > 0 ? femaleData.averageAdditionalSalary : null,
      ),
      totalWageGapPercent: computeWageGap(
        males.length > 0 ? maleData.averageTotal : null,
        females.length > 0 ? femaleData.averageTotal : null,
      ),
    }
  }

  // ── Private helpers ─────────────────────────────────────────────

  private async fetchEmployees(
    reportId: string,
  ): Promise<ReportEmployeeModel[]> {
    const employees = await this.reportEmployeeModel.findAll({
      where: {
        reportId,
        gender: { [Op.in]: [GenderEnum.MALE, GenderEnum.FEMALE] },
      },
    })

    if (employees.length === 0) {
      throw new NotFoundException(
        `No employees found for report "${reportId}"`,
      )
    }

    return employees
  }

  /**
   * Returns a Map of stepId → score for all steps belonging to
   * non-PERSONAL criteria in this report.
   */
  private async getWorkStepScores(
    reportId: string,
  ): Promise<Map<string, number>> {
    const criteria = await this.reportCriterionModel.findAll({
      where: {
        reportId,
        type: { [Op.ne]: ReportCriterionTypeEnum.PERSONAL },
      },
    })

    const subCriteria = await this.reportSubCriterionModel.findAll({
      where: {
        reportCriterionId: { [Op.in]: criteria.map((c) => c.id) },
      },
    })

    const steps = await this.reportSubCriterionStepModel.findAll({
      where: {
        reportSubCriterionId: { [Op.in]: subCriteria.map((sc) => sc.id) },
      },
    })

    return new Map(steps.map((s) => [s.id, s.score]))
  }

  /** Returns roleId → Set<stepId> for all role-criterion-step links. */
  private async getRoleStepsByRole(
    roleIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const links = await this.roleStepModel.findAll({
      where: { reportEmployeeRoleId: { [Op.in]: roleIds } },
    })

    const map = new Map<string, Set<string>>()
    for (const link of links) {
      let set = map.get(link.reportEmployeeRoleId)
      if (!set) {
        set = new Set()
        map.set(link.reportEmployeeRoleId, set)
      }
      set.add(link.reportSubCriterionStepId)
    }
    return map
  }

  /** Returns employeeId → Set<stepId> for all personal-criterion-step links. */
  private async getPersonalStepsByEmployee(
    employeeIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const links = await this.personalStepModel.findAll({
      where: { reportEmployeeId: { [Op.in]: employeeIds } },
    })

    const map = new Map<string, Set<string>>()
    for (const link of links) {
      let set = map.get(link.reportEmployeeId)
      if (!set) {
        set = new Set()
        map.set(link.reportEmployeeId, set)
      }
      set.add(link.reportSubCriterionStepId)
    }
    return map
  }

  /** Computes a single employee's work score (non-PERSONAL steps only). */
  private computeEmployeeWorkScore(
    employee: ReportEmployeeModel,
    workStepScores: Map<string, number>,
    roleStepsByRole: Map<string, Set<string>>,
    personalStepsByEmployee: Map<string, Set<string>>,
  ): number {
    const stepIds = new Set<string>()

    const rSteps = roleStepsByRole.get(employee.reportEmployeeRoleId)
    if (rSteps) {
      for (const id of rSteps) {
        if (workStepScores.has(id)) stepIds.add(id)
      }
    }

    const pSteps = personalStepsByEmployee.get(employee.id)
    if (pSteps) {
      for (const id of pSteps) {
        if (workStepScores.has(id)) stepIds.add(id)
      }
    }

    let workScore = 0
    for (const stepId of stepIds) {
      workScore += workStepScores.get(stepId) ?? 0
    }
    return workScore
  }
}

// ── Pure computation helpers ────────────────────────────────────────

function buildWageGapResponse(points: EmployeeDataPoint[]): GenderWageGapDto {
  const males = points.filter((point) => point.gender === GenderEnum.MALE)
  const females = points.filter((point) => point.gender === GenderEnum.FEMALE)
  const snapshot = computeSalaryAggregateSnapshot(
    points.map((point) => ({
      gender: point.gender,
      salary: point.adjustedSalary,
    })),
  )

  return {
    maleAverageSalary: Math.round(snapshot.male.average ?? 0),
    femaleAverageSalary: Math.round(snapshot.female.average ?? 0),
    overallAverageSalary: Math.round(snapshot.overall.average ?? 0),
    maleMedianSalary: Math.round(snapshot.male.median ?? 0),
    femaleMedianSalary: Math.round(snapshot.female.median ?? 0),
    overallMedianSalary: Math.round(snapshot.overall.median ?? 0),
    averageWageGapPercent: roundNullable(
      snapshot.salaryDifferences.maleFemale,
      1,
    ),
    medianWageGapPercent: roundNullable(
      computeWageGapPercent(snapshot.male.median, snapshot.female.median),
      1,
    ),
    maleCount: males.length,
    femaleCount: females.length,
  }
}

function buildChartResponse(
  points: EmployeeDataPoint[],
): SalaryByGenderAndScoreDto {
  const dataPoints: ScatterDataPointDto[] = points.map((p) => ({
    score: p.score,
    adjustedSalary: Math.round(p.adjustedSalary),
    gender: p.gender,
  }))

  return {
    dataPoints,
    regressionLine: computeLinearRegression(points),
    scoreBuckets: computeScoreBuckets(points),
    totals: computeTotals(points),
  }
}

function computeLinearRegression(
  points: EmployeeDataPoint[],
): RegressionLineDto {
  const n = points.length
  if (n < 2) {
    return { slope: 0, intercept: n === 1 ? points[0].adjustedSalary : 0 }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (const p of points) {
    sumX += p.score
    sumY += p.adjustedSalary
    sumXY += p.score * p.adjustedSalary
    sumX2 += p.score * p.score
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
  }
}

function computeScoreBuckets(points: EmployeeDataPoint[]): ScoreBucketDto[] {
  const salaryPoints: SalaryScorePoint[] = points.map((point) => ({
    score: point.score,
    gender: point.gender,
    salary: point.adjustedSalary,
  }))

  return computeSalaryScoreBucketSnapshots(
    salaryPoints,
    BUCKET_WIDTH,
  ).map((bucket) => {
    const snapshot = bucket.totals

    return {
      rangeFrom: bucket.rangeFrom,
      rangeTo: bucket.rangeTo,
      maleAverageSalary:
        snapshot.male.average !== null
          ? Math.round(snapshot.male.average)
          : null,
      femaleAverageSalary:
        snapshot.female.average !== null
          ? Math.round(snapshot.female.average)
          : null,
      overallAverageSalary: Math.round(snapshot.overall.average ?? 0),
      maleMedianSalary:
        snapshot.male.median !== null ? Math.round(snapshot.male.median) : null,
      femaleMedianSalary:
        snapshot.female.median !== null
          ? Math.round(snapshot.female.median)
          : null,
      overallMedianSalary: Math.round(snapshot.overall.median ?? 0),
      wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
      maleCount: bucket.counts.male,
      femaleCount: bucket.counts.female,
    }
  })
}

function computeTotals(points: EmployeeDataPoint[]): SalaryTotalsDto {
  const males = points.filter((point) => point.gender === GenderEnum.MALE)
  const females = points.filter((point) => point.gender === GenderEnum.FEMALE)
  const snapshot = computeSalaryAggregateSnapshot(
    points.map((point) => ({
      gender: point.gender,
      salary: point.adjustedSalary,
    })),
  )

  return {
    maleAverageSalary: Math.round(snapshot.male.average ?? 0),
    femaleAverageSalary: Math.round(snapshot.female.average ?? 0),
    overallAverageSalary: Math.round(snapshot.overall.average ?? 0),
    maleMedianSalary: Math.round(snapshot.male.median ?? 0),
    femaleMedianSalary: Math.round(snapshot.female.median ?? 0),
    overallMedianSalary: Math.round(snapshot.overall.median ?? 0),
    wageGapPercent: roundNullable(snapshot.salaryDifferences.maleFemale, 1),
    maleCount: males.length,
    femaleCount: females.length,
  }
}

/** Average/median for raw number arrays (used by benefits breakdown). */
function avg(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function med(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function computeWageGap(
  maleAvg: number | null,
  femaleAvg: number | null,
): number | null {
  return roundNullable(computeWageGapPercent(maleAvg, femaleAvg), 1)
}
