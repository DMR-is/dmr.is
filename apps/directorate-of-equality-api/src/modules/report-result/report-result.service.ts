import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CONFIG_KEYS, readNumericConfig } from '../config/lib/numeric-config'
import { ConfigModel } from '../config/models/config.model'
import {
  computeCompensationAggregates,
  getRegularHourlyWage,
  roundSalaryResultSnapshot,
} from '../report/lib/compensation-aggregates'
import {
  computeWageGapDecomposition,
  roundWageGapDecompositionSnapshot,
} from '../report/lib/wage-gap-decomposition'
import { ReportModel, ReportTypeEnum } from '../report/models/report.model'
import {
  ReportEmployeeModel,
  requireComputedScore,
} from '../report-employee/models/report-employee.model'
import { ReportResultDto } from './dto/report-result.dto'
import {
  type ReportResultCreateAttributes,
  ReportResultModel,
} from './models/report-result.model'
import { IReportResultService } from './report-result.service.interface'

const LOGGING_CONTEXT = 'ReportResultService'
/**
 * `v2` = reglulegt tímakaup. `v1` evaluated FTE-adjusted monthly salary
 * (`baseSalary / workRatio`) and stored separate base/full snapshots; the two
 * are not comparable, and no v1 row survived the migration that introduced
 * `paid_hours`.
 */
const REPORT_RESULT_CALCULATION_VERSION = 'v2'

@Injectable()
export class ReportResultService implements IReportResultService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportResultModel)
    private readonly reportResultModel: typeof ReportResultModel,
    @InjectModel(ConfigModel)
    private readonly configModel: typeof ConfigModel,
  ) {}

  async getByReportId(reportId: string): Promise<ReportResultDto> {
    const result = await this.reportResultModel.findOne({
      where: { reportId },
    })

    if (!result) {
      throw new NotFoundException(
        `Report result for report "${reportId}" not found`,
      )
    }

    return result.fromModel()
  }

  async createForReport(reportId: string): Promise<ReportResultDto> {
    this.logger.info(`Creating persisted result for report "${reportId}"`, {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const report = await this.reportModel.findOne({ where: { id: reportId } })

    if (!report) {
      throw new NotFoundException(`Report "${reportId}" not found`)
    }

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        `Report "${reportId}" must be a SALARY report to create a report result`,
      )
    }

    const existingResult = await this.reportResultModel.findOne({
      where: { reportId },
    })

    if (existingResult) {
      throw new ConflictException(
        `Report result for report "${reportId}" already exists`,
      )
    }

    const employees = await this.reportEmployeeModel.findAll({
      where: { reportId },
    })

    if (employees.length === 0) {
      throw new NotFoundException(`No employees found for report "${reportId}"`)
    }

    const threshold = await readNumericConfig(
      this.configModel,
      CONFIG_KEYS.SALARY_DIFFERENCE_THRESHOLD_PERCENT,
    )

    const aggregates = computeCompensationAggregates({
      employees: employees.map((employee) => ({
        reportEmployeeRoleId: employee.reportEmployeeRoleId,
        score: requireComputedScore(employee),
        gender: employee.gender,
        paidHours: employee.paidHours,
        baseSalary: employee.baseSalary,
        additionalSalary: employee.additionalSalary,
        bonusSalary: employee.bonusSalary,
      })),
    })
    // The decomposition runs on the same employee rows as the aggregates, so
    // the two figures a reviewer sees can never disagree about who was counted.
    const wageGapDecomposition = computeWageGapDecomposition({
      employees: employees.map((employee) => ({
        ordinal: employee.ordinal,
        gender: employee.gender,
        score: requireComputedScore(employee),
        hourlyWage: getRegularHourlyWage(employee),
      })),
      benchmarkPercent: threshold,
    })

    const resultValues = {
      reportId,
      salaryDifferenceThresholdPercent: threshold,
      calculationVersion: REPORT_RESULT_CALCULATION_VERSION,
      salarySnapshot: roundSalaryResultSnapshot(aggregates.report.snapshot, 2),
      wageGapDecompositionSnapshot:
        roundWageGapDecompositionSnapshot(wageGapDecomposition),
    } satisfies ReportResultCreateAttributes

    await this.reportResultModel.create(resultValues)

    return this.getByReportId(reportId)
  }
}
