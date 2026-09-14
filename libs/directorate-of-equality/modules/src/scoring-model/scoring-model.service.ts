import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CompanyDto } from '../company/dto/company.dto'
import {
  CreateScoringCriterionDto,
  ScoringCriterionDto,
  UpdateScoringCriterionDto,
} from './dto/scoring-criterion.dto'
import {
  CreateScoringModelDto,
  GetScoringModelsResponseDto,
  ScoringModelDto,
  ScoringModelSummaryDto,
  ScoringRoleDto,
} from './dto/scoring-model.dto'
import {
  CreateScoringSubCriterionDto,
  ScoringSubCriterionDto,
  UpdateScoringSubCriterionDto,
} from './dto/scoring-sub-criterion.dto'
import { validateScoringModel } from './lib/validate-scoring-model'
import { ScoringCriterionModel } from './models/scoring-criterion.model'
import { ScoringModelModel } from './models/scoring-model.model'
import { ScoringRoleModel } from './models/scoring-role.model'
import { ScoringRoleStepModel } from './models/scoring-role-step.model'
import { ScoringSubCriterionModel } from './models/scoring-sub-criterion.model'
import { ScoringSubCriterionStepModel } from './models/scoring-sub-criterion-step.model'
import { IScoringModelService } from './scoring-model.service.interface'

@Injectable()
export class ScoringModelService implements IScoringModelService {
  constructor(
    @InjectModel(ScoringModelModel)
    private readonly scoringModelModel: typeof ScoringModelModel,
    @InjectModel(ScoringCriterionModel)
    private readonly criterionModel: typeof ScoringCriterionModel,
    @InjectModel(ScoringSubCriterionModel)
    private readonly subCriterionModel: typeof ScoringSubCriterionModel,
  ) {}

  /**
   * The ownership gate every other method goes through.
   *
   * Scoped by `companyId` rather than checked after the fact, so a model
   * belonging to another company is indistinguishable from one that does not
   * exist — the id alone gets a caller nowhere.
   */
  private async findOwnedModel(
    company: CompanyDto,
    modelId: string,
  ): Promise<ScoringModelModel> {
    const model = await this.scoringModelModel.findOne({
      where: { id: modelId, companyId: company.id },
      include: [
        {
          model: ScoringCriterionModel,
          as: 'criteria',
          required: false,
          include: [
            {
              model: ScoringSubCriterionModel,
              as: 'subCriteria',
              required: false,
              include: [
                {
                  model: ScoringSubCriterionStepModel,
                  as: 'steps',
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: ScoringRoleModel,
          as: 'roles',
          required: false,
          include: [
            {
              model: ScoringRoleStepModel,
              as: 'stepAssignments',
              required: false,
            },
          ],
        },
      ],
      // Without this the tree comes back in whatever order Postgres returns,
      // which shifts between calls and reshuffles a caller's list for no
      // reason. Steps are ordered in `toDto` by `stepOrder`, which is their
      // own meaning; everything else has none, so insertion order it is.
      order: [
        [{ model: ScoringCriterionModel, as: 'criteria' }, 'createdAt', 'ASC'],
        [
          { model: ScoringCriterionModel, as: 'criteria' },
          { model: ScoringSubCriterionModel, as: 'subCriteria' },
          'createdAt',
          'ASC',
        ],
        [{ model: ScoringRoleModel, as: 'roles' }, 'createdAt', 'ASC'],
      ],
    })

    if (!model) {
      throw new NotFoundException('Starfsmat fannst ekki')
    }

    return model
  }

  /** Asserts the criterion belongs to this model, not merely that it exists. */
  private async findOwnedCriterion(
    modelId: string,
    criterionId: string,
  ): Promise<ScoringCriterionModel> {
    const criterion = await this.criterionModel.findOne({
      where: { id: criterionId, scoringModelId: modelId },
    })

    if (!criterion) {
      throw new NotFoundException('Viðmið fannst ekki í þessu starfsmati')
    }

    return criterion
  }

  private async findOwnedSubCriterion(
    criterionId: string,
    subCriterionId: string,
  ): Promise<ScoringSubCriterionModel> {
    const sub = await this.subCriterionModel.findOne({
      where: { id: subCriterionId, scoringCriterionId: criterionId },
    })

    if (!sub) {
      throw new NotFoundException('Undirviðmið fannst ekki undir þessu viðmiði')
    }

    return sub
  }

  private toDto(model: ScoringModelModel): ScoringModelDto {
    const criteria: ScoringCriterionDto[] = (model.criteria ?? []).map(
      (criterion) => {
        const subCriteria: ScoringSubCriterionDto[] = (
          criterion.subCriteria ?? []
        ).map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          weight: sub.weight,
          steps: (sub.steps ?? [])
            .slice()
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step) => ({
              id: step.id,
              stepOrder: step.stepOrder,
              description: step.description,
            })),
        }))

        return {
          id: criterion.id,
          type: criterion.type,
          title: criterion.title,
          description: criterion.description,
          // Derived, never stored — see the model and the migration.
          weight: subCriteria.reduce((total, s) => total + s.weight, 0),
          subCriteria,
        }
      },
    )

    const roles: ScoringRoleDto[] = (model.roles ?? []).map((role) => ({
      id: role.id,
      title: role.title,
      stepAssignments: (role.stepAssignments ?? []).map((a) => ({
        subCriterionId: a.scoringSubCriterionId,
        stepId: a.scoringSubCriterionStepId,
      })),
    }))

    return {
      id: model.id,
      name: model.name,
      criteria,
      roles,
      validation: validateScoringModel({ criteria, roles }),
    }
  }

  /** Re-reads the whole tree so the returned validity reflects the write. */
  private async reload(
    company: CompanyDto,
    modelId: string,
  ): Promise<ScoringModelDto> {
    return this.toDto(await this.findOwnedModel(company, modelId))
  }

  async createModel(
    company: CompanyDto,
    input: CreateScoringModelDto,
  ): Promise<ScoringModelSummaryDto> {
    const created = await this.scoringModelModel.create({
      companyId: company.id,
      name: input.name,
    })

    return { id: created.id, name: created.name }
  }

  async listModels(company: CompanyDto): Promise<GetScoringModelsResponseDto> {
    const models = await this.scoringModelModel.findAll({
      where: { companyId: company.id },
      order: [['createdAt', 'ASC']],
    })

    return {
      models: models.map((m) => ({ id: m.id, name: m.name })),
    }
  }

  async getModel(
    company: CompanyDto,
    modelId: string,
  ): Promise<ScoringModelDto> {
    return this.toDto(await this.findOwnedModel(company, modelId))
  }

  async deleteModel(company: CompanyDto, modelId: string): Promise<void> {
    const model = await this.findOwnedModel(company, modelId)
    // The tree goes with it: every FK below is ON DELETE CASCADE.
    await model.destroy()
  }

  async createCriterion(
    company: CompanyDto,
    modelId: string,
    input: CreateScoringCriterionDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)

    await this.criterionModel.create({
      scoringModelId: modelId,
      type: input.type,
      title: input.title,
      description: input.description,
    })

    return this.reload(company, modelId)
  }

  async updateCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    input: UpdateScoringCriterionDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    const criterion = await this.findOwnedCriterion(modelId, criterionId)

    // PATCH semantics: an omitted key is left alone, never cleared.
    await criterion.update({
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    })

    return this.reload(company, modelId)
  }

  async deleteCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    const criterion = await this.findOwnedCriterion(modelId, criterionId)

    // Deleting a mandatory type leaves the model invalid rather than refusing
    // the call — the response says so, and the filing is what enforces it.
    await criterion.destroy()

    return this.reload(company, modelId)
  }

  async createSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    input: CreateScoringSubCriterionDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    await this.findOwnedCriterion(modelId, criterionId)

    await this.subCriterionModel.create({
      scoringCriterionId: criterionId,
      title: input.title,
      description: input.description,
      weight: input.weight,
    })

    return this.reload(company, modelId)
  }

  async updateSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
    input: UpdateScoringSubCriterionDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    await this.findOwnedCriterion(modelId, criterionId)
    const sub = await this.findOwnedSubCriterion(criterionId, subCriterionId)

    await sub.update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
    })

    return this.reload(company, modelId)
  }

  async deleteSubCriterion(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    await this.findOwnedCriterion(modelId, criterionId)
    const sub = await this.findOwnedSubCriterion(criterionId, subCriterionId)

    await sub.destroy()

    return this.reload(company, modelId)
  }
}
