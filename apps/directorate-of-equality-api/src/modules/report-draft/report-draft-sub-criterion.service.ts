import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../company/dto/company.dto'
import { ReportSubCriterionDto } from '../report-criterion/dto/report-sub-criterion.dto'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { CreateSubCriterionDto } from './dto/create-sub-criterion.dto'
import { UpdateSubCriterionDto } from './dto/update-sub-criterion.dto'
import { IReportDraftService } from './report-draft.service.interface'
import { IReportDraftSubCriterionService } from './report-draft-sub-criterion.service.interface'

const LOGGING_CONTEXT = 'ReportDraftSubCriterionService'

/** Editable sub-criterion columns — `reportCriterionId` is never patched. */
const SUB_CRITERION_PATCH_KEYS = ['title', 'description', 'weight'] as const

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
    await this.assertCriterionInDraft(providerId, company, criterionId)

    const rows = await this.subCriterionModel.findAll({
      where: { reportCriterionId: criterionId },
      order: [['createdAt', 'ASC']],
    })

    return rows.map((row) => ReportSubCriterionModel.fromModel(row))
  }

  async createSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    input: CreateSubCriterionDto,
  ): Promise<ReportSubCriterionDto> {
    await this.assertCriterionInDraft(providerId, company, criterionId)

    const row = await this.subCriterionModel.create({
      reportCriterionId: criterionId,
      title: input.title.trim(),
      description: input.description,
      weight: input.weight,
    })

    this.logger.info(`Created draft sub-criterion "${row.id}"`, {
      context: LOGGING_CONTEXT,
      criterionId,
    })

    return ReportSubCriterionModel.fromModel(row)
  }

  async updateSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    subCriterionId: string,
    input: UpdateSubCriterionDto,
  ): Promise<ReportSubCriterionDto> {
    await this.assertCriterionInDraft(providerId, company, criterionId)

    const row = await this.findOwnedSubCriterion(criterionId, subCriterionId)

    const patch: UpdateSubCriterionDto = {}
    for (const key of SUB_CRITERION_PATCH_KEYS) {
      if (input[key] !== undefined) {
        // The key list is the source of truth; each value matches its column.
        ;(patch as Record<string, unknown>)[key] = input[key]
      }
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }

    return ReportSubCriterionModel.fromModel(row)
  }

  async deleteSubCriterion(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
    subCriterionId: string,
  ): Promise<void> {
    await this.assertCriterionInDraft(providerId, company, criterionId)

    const row = await this.findOwnedSubCriterion(criterionId, subCriterionId)

    // Cascade by hand (no DB cascade): steps → the role/employee step
    // assignments pointing at them. Atomic under the CLS request transaction.
    const steps = await this.stepModel.findAll({
      where: { reportSubCriterionId: subCriterionId },
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

  /** Resolves the owned draft and asserts the criterion belongs to it. */
  private async assertCriterionInDraft(
    providerId: string,
    company: CompanyDto,
    criterionId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const criterion = await this.criterionModel.findOne({
      where: { id: criterionId, reportId: report.id },
    })
    if (!criterion) {
      throw new NotFoundException(`Criterion "${criterionId}" not found`)
    }
  }

  /** Loads a sub-criterion and asserts it belongs to the given criterion. */
  private async findOwnedSubCriterion(
    criterionId: string,
    subCriterionId: string,
  ): Promise<ReportSubCriterionModel> {
    const row = await this.subCriterionModel.findOne({
      where: { id: subCriterionId, reportCriterionId: criterionId },
    })
    if (!row) {
      throw new NotFoundException(`Sub-criterion "${subCriterionId}" not found`)
    }
    return row
  }
}
