import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigModel } from '../config/models/config.model'
import {
  computeCompensationAggregates,
  roundSalaryResultSnapshot,
} from '../report/lib/compensation-aggregates'
import { ReportModel, ReportTypeEnum } from '../report/models/report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportResultDto } from './dto/report-result.dto'
import {
  type ReportResultCreateAttributes,
  ReportResultModel,
} from './models/report-result.model'
import { IReportResultService } from './report-result.service.interface'

const LOGGING_CONTEXT = 'ReportResultService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'
const REPORT_RESULT_CALCULATION_VERSION = 'v1'

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

    const thresholdConfig = await this.configModel.findOne({
      where: {
        key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
        supersededAt: null,
      },
    })

    if (!thresholdConfig) {
      throw new NotFoundException(
        `Config entry "${SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY}" not found`,
      )
    }

    const threshold = parseFloat(thresholdConfig.value)

    if (!Number.isFinite(threshold)) {
      throw new InternalServerErrorException(
        `Config entry "${SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY}" must be numeric`,
      )
    }

    const aggregates = computeCompensationAggregates({
      employees: employees.map((employee) => ({
        reportEmployeeRoleId: employee.reportEmployeeRoleId,
        score: employee.score,
        gender: employee.gender,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
        additionalSalary: employee.additionalSalary,
        bonusSalary: employee.bonusSalary,
      })),
    })

    const resultValues = {
      reportId,
      salaryDifferenceThresholdPercent: threshold,
      calculationVersion: REPORT_RESULT_CALCULATION_VERSION,
      baseSnapshot: roundSalaryResultSnapshot(aggregates.report.base, 2),
      fullSnapshot: roundSalaryResultSnapshot(aggregates.report.full, 2),
    } satisfies ReportResultCreateAttributes

    await this.reportResultModel.create(resultValues)

    return this.getByReportId(reportId)
  }
}
