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
import { ReportSubCriterionDto } from '../../report-criterion/dto/report-sub-criterion.dto'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { SubCriterionChangeDataDto } from '../sync/dto/change-sub-criterion.dto'
import { IReportDraftSubCriterionService } from './report-draft-sub-criterion.service.interface'

const LOGGING_CONTEXT = 'ReportDraftSubCriterionService'

@Injectable()
export class ReportDraftSubCriterionService
  implements IReportDraftSubCriterionService
{
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

  async listSubCriteria(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<ReportSubCriterionDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertCriterionInReport(report.id, criterionId)

    const rows = await this.subCriterionModel.findAll({
      where: { reportCriterionId: criterionId },
      order: [['createdAt', 'ASC']],
    })

    return rows.map((row) => ReportSubCriterionModel.fromModel(row))
  }

  /** Upserts a sub-criterion from a sync CREATE command under its parent. */
  async createSubCriterion(
    report: ReportModel,
    id: string,
    data: SubCriterionChangeDataDto,
  ): Promise<void> {
    const title = data.title?.trim()
    if (
      !data.criterionId ||
      !title ||
      data.description === undefined ||
      data.weight === undefined
    ) {
      throw new BadRequestException(
        'Sub-criterion CREATE requires criterionId, title, description and weight',
      )
    }
    await this.assertCriterionInReport(report.id, data.criterionId)

    const existing = await this.subCriterionModel.findByPk(id)
    if (existing) {
      if (existing.reportCriterionId !== data.criterionId) {
        throw new BadRequestException(
          `Sub-criterion "${id}" belongs to a different criterion`,
        )
      }
      await existing.update({
        title,
        description: data.description,
        weight: data.weight,
      })
      return
    }

    const row = this.subCriterionModel.build({
      reportCriterionId: data.criterionId,
      title,
      description: data.description,
      weight: data.weight,
    })
    row.id = id
    await row.save()

    this.logger.info(`Synced draft sub-criterion "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches a sub-criterion from a sync UPDATE command (PATCH semantics). */
  async updateSubCriterion(
    report: ReportModel,
    id: string,
    data: SubCriterionChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedSubCriterion(report.id, id)

    const patch: Record<string, unknown> = {}
    if (data.title !== undefined) {
      const title = data.title.trim()
      if (!title) {
        throw new BadRequestException('Sub-criterion title must not be empty')
      }
      patch.title = title
    }
    if (data.description !== undefined) {
      patch.description = data.description
    }
    if (data.weight !== undefined) {
      patch.weight = data.weight
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }
  }

  /**
   * Removes a sub-criterion and its steps (and the role/employee assignments
   * pointing at them) by hand. Atomic under the sync request transaction.
   */
  async removeSubCriterion(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedSubCriterion(report.id, id)

    const steps = await this.stepModel.findAll({
      where: { reportSubCriterionId: id },
      attributes: ['id'],
    })
    const stepIds = steps.map((step) => step.id)

    if (stepIds.length > 0) {
      await this.roleStepModel.destroy({
        where: { reportSubCriterionStepId: stepIds },
      })
      await this.personalStepModel.destroy({
        where: { reportSubCriterionStepId: stepIds },
      })
      await this.stepModel.destroy({ where: { id: stepIds } })
    }

    await row.destroy()
  }

  /** Asserts the criterion exists on the given (owned) draft. */
  private async assertCriterionInReport(
    reportId: string,
    criterionId: string,
  ): Promise<void> {
    const criterion = await this.criterionModel.findOne({
      where: { id: criterionId, reportId },
      attributes: ['id'],
    })
    if (!criterion) {
      throw new BadRequestException(
        `Criterion "${criterionId}" does not belong to this report`,
      )
    }
  }

  /**
   * Loads a sub-criterion and asserts it belongs to the given draft, walking
   * sub-criterion → criterion → report.
   */
  private async findOwnedSubCriterion(
    reportId: string,
    subCriterionId: string,
  ): Promise<ReportSubCriterionModel> {
    const row = await this.subCriterionModel.findByPk(subCriterionId)
    if (!row) {
      throw new NotFoundException(`Sub-criterion "${subCriterionId}" not found`)
    }
    const criterion = await this.criterionModel.findOne({
      where: { id: row.reportCriterionId, reportId },
      attributes: ['id'],
    })
    if (!criterion) {
      throw new NotFoundException(`Sub-criterion "${subCriterionId}" not found`)
    }
    return row
  }
}
