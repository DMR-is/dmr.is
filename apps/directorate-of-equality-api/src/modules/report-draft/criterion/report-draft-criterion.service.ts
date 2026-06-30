import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportCriterionDto } from '../../report-criterion/dto/report-criterion.dto'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { CreateCriterionDto } from './dto/create-criterion.dto'
import { UpdateCriterionDto } from './dto/update-criterion.dto'
import { IReportDraftCriterionService } from './report-draft-criterion.service.interface'

const LOGGING_CONTEXT = 'ReportDraftCriterionService'

/** Editable criterion columns — `reportId` is never patched. */
const CRITERION_PATCH_KEYS = ['title', 'weight', 'description', 'type'] as const

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

  async createCriterion(
    providerId: string,
    company: CompanyDto,
    input: CreateCriterionDto,
  ): Promise<ReportCriterionDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.criterionModel.create({
      reportId: report.id,
      title: input.title.trim(),
      weight: input.weight,
      description: input.description,
      type: input.type,
    })

    this.logger.info(`Created draft criterion "${row.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return ReportCriterionModel.fromModel(row)
  }

  async updateCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    input: UpdateCriterionDto,
  ): Promise<ReportCriterionDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedCriterion(report.id, criterionId)

    const patch: UpdateCriterionDto = {}
    for (const key of CRITERION_PATCH_KEYS) {
      if (input[key] !== undefined) {
        // The key list is the source of truth; each value matches its column.
        ;(patch as Record<string, unknown>)[key] = input[key]
      }
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }

    return ReportCriterionModel.fromModel(row)
  }

  async deleteCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedCriterion(report.id, criterionId)

    // Cascade the subtree by hand (no DB cascade): sub-criteria → steps → the
    // role/employee step-assignments pointing at those steps. The request runs
    // in a CLS-managed transaction, so this is atomic.
    const subs = await this.subCriterionModel.findAll({
      where: { reportCriterionId: criterionId },
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
