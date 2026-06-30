import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../company/dto/company.dto'
import { ReportSubCriterionStepDto } from '../report-criterion/dto/report-sub-criterion-step.dto'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { CreateStepDto } from './dto/create-step.dto'
import { UpdateStepDto } from './dto/update-step.dto'
import { IReportDraftService } from './report-draft.service.interface'
import { IReportDraftStepService } from './report-draft-step.service.interface'

const LOGGING_CONTEXT = 'ReportDraftStepService'

/** Editable step columns — `reportSubCriterionId` is never patched. */
const STEP_PATCH_KEYS = ['order', 'description', 'score'] as const

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
    await this.assertSubCriterionInDraft(providerId, company, subCriterionId)

    const rows = await this.stepModel.findAll({
      where: { reportSubCriterionId: subCriterionId },
      order: [['order', 'ASC']],
    })

    return rows.map((row) => ReportSubCriterionStepModel.fromModel(row))
  }

  async createStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    input: CreateStepDto,
  ): Promise<ReportSubCriterionStepDto> {
    await this.assertSubCriterionInDraft(providerId, company, subCriterionId)

    const row = await this.stepModel.create({
      reportSubCriterionId: subCriterionId,
      order: input.order,
      description: input.description,
      score: input.score,
    })

    this.logger.info(`Created draft step "${row.id}"`, {
      context: LOGGING_CONTEXT,
      subCriterionId,
    })

    return ReportSubCriterionStepModel.fromModel(row)
  }

  async updateStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    stepId: string,
    input: UpdateStepDto,
  ): Promise<ReportSubCriterionStepDto> {
    await this.assertSubCriterionInDraft(providerId, company, subCriterionId)

    const row = await this.findOwnedStep(subCriterionId, stepId)

    const patch: UpdateStepDto = {}
    for (const key of STEP_PATCH_KEYS) {
      if (input[key] !== undefined) {
        // The key list is the source of truth; each value matches its column.
        ;(patch as Record<string, unknown>)[key] = input[key]
      }
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }

    return ReportSubCriterionStepModel.fromModel(row)
  }

  async deleteStep(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
    stepId: string,
  ): Promise<void> {
    await this.assertSubCriterionInDraft(providerId, company, subCriterionId)

    const row = await this.findOwnedStep(subCriterionId, stepId)

    // Remove the role/employee assignments pointing at this step before the
    // step itself (no DB cascade). Atomic under the CLS request transaction.
    await this.roleStepModel.destroy({
      where: { reportSubCriterionStepId: stepId },
    })
    await this.personalStepModel.destroy({
      where: { reportSubCriterionStepId: stepId },
    })

    await row.destroy()
  }

  /**
   * Resolves the owned draft and asserts the sub-criterion belongs to it,
   * walking sub-criterion → criterion → report.
   */
  private async assertSubCriterionInDraft(
    providerId: string,
    company: CompanyDto,
    subCriterionId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const sub = await this.subCriterionModel.findOne({
      where: { id: subCriterionId },
      attributes: ['id', 'reportCriterionId'],
    })
    if (!sub) {
      throw new NotFoundException(`Sub-criterion "${subCriterionId}" not found`)
    }

    const criterion = await this.criterionModel.findOne({
      where: { id: sub.reportCriterionId, reportId: report.id },
      attributes: ['id'],
    })
    if (!criterion) {
      throw new NotFoundException(`Sub-criterion "${subCriterionId}" not found`)
    }
  }

  /** Loads a step and asserts it belongs to the given sub-criterion. */
  private async findOwnedStep(
    subCriterionId: string,
    stepId: string,
  ): Promise<ReportSubCriterionStepModel> {
    const row = await this.stepModel.findOne({
      where: { id: stepId, reportSubCriterionId: subCriterionId },
    })
    if (!row) {
      throw new NotFoundException(`Step "${stepId}" not found`)
    }
    return row
  }
}
