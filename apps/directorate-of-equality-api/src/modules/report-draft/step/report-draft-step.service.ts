import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportSubCriterionStepDto } from '../../report-criterion/dto/report-sub-criterion-step.dto'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { StepChangeDataDto } from '../sync/dto/change-step.dto'
import { IReportDraftStepService } from './report-draft-step.service.interface'

const LOGGING_CONTEXT = 'ReportDraftStepService'

@Injectable()
export class ReportDraftStepService implements IReportDraftStepService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
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

  async listSteps(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
  ): Promise<ReportSubCriterionStepDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertSubCriterionInReport(report.id, subCriterionId)

    const rows = await this.stepModel.findAll({
      where: { reportSubCriterionId: subCriterionId },
      order: [['order', 'ASC']],
    })

    return rows.map((row) => ReportSubCriterionStepModel.fromModel(row))
  }

  /** Upserts a scoring step from a sync CREATE command under its parent. */
  async createStep(
    report: ReportModel,
    id: string,
    data: StepChangeDataDto,
  ): Promise<void> {
    if (
      !data.subCriterionId ||
      data.order === undefined ||
      data.description === undefined ||
      data.score === undefined
    ) {
      throw new BadRequestException(
        'Step CREATE requires subCriterionId, order, description and score',
      )
    }
    await this.assertSubCriterionInReport(report.id, data.subCriterionId)

    const existing = await this.stepModel.findByPk(id)
    if (existing) {
      if (existing.reportSubCriterionId !== data.subCriterionId) {
        throw new BadRequestException(
          `Step "${id}" belongs to a different sub-criterion`,
        )
      }
      await existing.update({
        order: data.order,
        description: data.description,
        score: data.score,
      })
      return
    }

    const row = this.stepModel.build({
      reportSubCriterionId: data.subCriterionId,
      order: data.order,
      description: data.description,
      score: data.score,
    })
    row.id = id
    await row.save()

    this.logger.info(`Synced draft step "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches a scoring step from a sync UPDATE command (PATCH semantics). */
  async updateStep(
    report: ReportModel,
    id: string,
    data: StepChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedStep(report.id, id)

    const patch: Record<string, unknown> = {}
    if (data.order !== undefined) {
      patch.order = data.order
    }
    if (data.description !== undefined) {
      patch.description = data.description
    }
    if (data.score !== undefined) {
      patch.score = data.score
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }
  }

  /**
   * Removes a scoring step and the role/employee assignments pointing at it.
   * Atomic under the sync request transaction.
   */
  async removeStep(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedStep(report.id, id)

    await this.roleStepModel.destroy({
      where: { reportSubCriterionStepId: id },
    })
    await this.personalStepModel.destroy({
      where: { reportSubCriterionStepId: id },
    })

    await row.destroy()
  }

  /** Asserts the sub-criterion resolves, via its criterion, to the draft. */
  private async assertSubCriterionInReport(
    reportId: string,
    subCriterionId: string,
  ): Promise<void> {
    const sub = await this.subCriterionModel.findByPk(subCriterionId, {
      attributes: ['id', 'reportCriterionId'],
    })
    if (!sub) {
      throw new BadRequestException(
        `Sub-criterion "${subCriterionId}" does not belong to this report`,
      )
    }
    const criterion = await this.criterionModel.findOne({
      where: { id: sub.reportCriterionId, reportId },
      attributes: ['id'],
    })
    if (!criterion) {
      throw new BadRequestException(
        `Sub-criterion "${subCriterionId}" does not belong to this report`,
      )
    }
  }

  /** Loads a step and asserts it resolves, via its parents, to the draft. */
  private async findOwnedStep(
    reportId: string,
    stepId: string,
  ): Promise<ReportSubCriterionStepModel> {
    const row = await this.stepModel.findByPk(stepId)
    if (!row) {
      throw new NotFoundException(`Step "${stepId}" not found`)
    }
    await this.assertSubCriterionInReport(reportId, row.reportSubCriterionId)
    return row
  }
}
