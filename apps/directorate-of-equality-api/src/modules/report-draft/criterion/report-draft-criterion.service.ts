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
import { ReportCriterionDto } from '../../report-criterion/dto/report-criterion.dto'
import { ReportSubCriterionDto } from '../../report-criterion/dto/report-sub-criterion.dto'
import { ReportSubCriterionStepDto } from '../../report-criterion/dto/report-sub-criterion-step.dto'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { CriterionChangeDataDto } from '../sync/dto/change-criterion.dto'
import { DraftCriterionWithSubCriteriaDto } from './dto/draft-criterion-with-sub-criteria.dto'
import { DraftSubCriterionWithStepsDto } from './dto/draft-sub-criterion-with-steps.dto'
import { IReportDraftCriterionService } from './report-draft-criterion.service.interface'

const LOGGING_CONTEXT = 'ReportDraftCriterionService'

@Injectable()
export class ReportDraftCriterionService
  implements IReportDraftCriterionService
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

  async listCriteria(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportCriterionDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const rows = await this.criterionModel.findAll({
      where: { reportId: report.id },
      order: [['createdAt', 'ASC']],
    })

    return rows.map((row) => ReportCriterionModel.fromModel(row))
  }

  /**
   * The draft's whole criteria tree — criteria → sub-criteria → steps — in one
   * response, replacing the 1 + N + M fan-out over `listCriteria` /
   * `listSubCriteria` / `listSteps` the portal needs to render a scoring screen.
   *
   * Three queries, one per level, each ordered by the same column its
   * per-parent endpoint uses. Ordering the flat result set by that column and
   * then grouping preserves each parent's relative child order, so the nesting
   * is identical to what the per-parent reads return.
   */
  async listCriteriaTree(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftCriterionWithSubCriteriaDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const criterionRows = await this.criterionModel.findAll({
      where: { reportId: report.id },
      order: [['createdAt', 'ASC']],
    })
    if (criterionRows.length === 0) {
      return []
    }

    const subCriterionRows = await this.subCriterionModel.findAll({
      where: { reportCriterionId: criterionRows.map((row) => row.id) },
      order: [['createdAt', 'ASC']],
    })

    const stepRows = subCriterionRows.length
      ? await this.stepModel.findAll({
          where: {
            reportSubCriterionId: subCriterionRows.map((row) => row.id),
          },
          order: [['order', 'ASC']],
        })
      : []

    const stepsBySubCriterionId = new Map<string, ReportSubCriterionStepDto[]>()
    for (const row of stepRows) {
      const step = ReportSubCriterionStepModel.fromModel(row)
      const existing = stepsBySubCriterionId.get(row.reportSubCriterionId)
      if (existing) {
        existing.push(step)
      } else {
        stepsBySubCriterionId.set(row.reportSubCriterionId, [step])
      }
    }

    const subCriteriaByCriterionId = new Map<
      string,
      DraftSubCriterionWithStepsDto[]
    >()
    for (const row of subCriterionRows) {
      const subCriterion: DraftSubCriterionWithStepsDto = {
        ...(ReportSubCriterionModel.fromModel(row) as ReportSubCriterionDto),
        steps: stepsBySubCriterionId.get(row.id) ?? [],
      }
      const existing = subCriteriaByCriterionId.get(row.reportCriterionId)
      if (existing) {
        existing.push(subCriterion)
      } else {
        subCriteriaByCriterionId.set(row.reportCriterionId, [subCriterion])
      }
    }

    return criterionRows.map((row) => ({
      ...ReportCriterionModel.fromModel(row),
      subCriteria: subCriteriaByCriterionId.get(row.id) ?? [],
    }))
  }

  /** Upserts a top-level criterion from a sync CREATE command. */
  async createCriterion(
    report: ReportModel,
    id: string,
    data: CriterionChangeDataDto,
  ): Promise<void> {
    const title = data.title?.trim()
    if (
      !title ||
      data.weight === undefined ||
      data.description === undefined ||
      data.type === undefined
    ) {
      throw new BadRequestException(
        'Criterion CREATE requires title, weight, description and type',
      )
    }

    const existing = await this.criterionModel.findByPk(id)
    if (existing) {
      if (existing.reportId !== report.id) {
        throw new BadRequestException(
          `Criterion "${id}" belongs to a different report`,
        )
      }
      await existing.update({
        title,
        weight: data.weight,
        description: data.description,
        type: data.type,
      })
      return
    }

    const row = this.criterionModel.build({
      title,
      weight: data.weight,
      description: data.description,
      type: data.type,
      reportId: report.id,
    })
    row.id = id
    await row.save()

    this.logger.info(`Synced draft criterion "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches a criterion from a sync UPDATE command (PATCH semantics). */
  async updateCriterion(
    report: ReportModel,
    id: string,
    data: CriterionChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedCriterion(report.id, id)

    const patch: Record<string, unknown> = {}
    if (data.title !== undefined) {
      const title = data.title.trim()
      if (!title) {
        throw new BadRequestException('Criterion title must not be empty')
      }
      patch.title = title
    }
    if (data.weight !== undefined) {
      patch.weight = data.weight
    }
    if (data.description !== undefined) {
      patch.description = data.description
    }
    if (data.type !== undefined) {
      patch.type = data.type
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }
  }

  /**
   * Removes a criterion and its entire subtree by hand (no DB cascade):
   * sub-criteria → steps → the role/employee assignments pointing at those
   * steps. Atomic under the sync request transaction.
   */
  async removeCriterion(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedCriterion(report.id, id)

    const subs = await this.subCriterionModel.findAll({
      where: { reportCriterionId: id },
      attributes: ['id'],
    })
    const subIds = subs.map((sub) => sub.id)

    if (subIds.length > 0) {
      const steps = await this.stepModel.findAll({
        where: { reportSubCriterionId: subIds },
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

      await this.subCriterionModel.destroy({ where: { id: subIds } })
    }

    await row.destroy()
  }

  /** Loads a criterion and asserts it belongs to the given (owned) draft. */
  private async findOwnedCriterion(
    reportId: string,
    criterionId: string,
  ): Promise<ReportCriterionModel> {
    const row = await this.criterionModel.findOne({
      where: { id: criterionId, reportId },
    })
    if (!row) {
      throw new NotFoundException(`Criterion "${criterionId}" not found`)
    }
    return row
  }
}
