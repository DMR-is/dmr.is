import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CompanyDto } from '../company/dto/company.dto'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
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
  CreateScoringRoleDto,
  SetScoringRoleStepAssignmentsDto,
  UpdateScoringRoleDto,
} from './dto/scoring-role.dto'
import { SetScoringStepsDto } from './dto/scoring-step.dto'
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
    @InjectModel(ScoringSubCriterionStepModel)
    private readonly stepModel: typeof ScoringSubCriterionStepModel,
    @InjectModel(ScoringRoleModel)
    private readonly roleModel: typeof ScoringRoleModel,
    @InjectModel(ScoringRoleStepModel)
    private readonly roleStepModel: typeof ScoringRoleStepModel,
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

  async setSteps(
    company: CompanyDto,
    modelId: string,
    criterionId: string,
    subCriterionId: string,
    input: SetScoringStepsDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    await this.findOwnedCriterion(modelId, criterionId)
    await this.findOwnedSubCriterion(criterionId, subCriterionId)

    // Replace rather than reconcile. Any role assignment onto the old steps
    // goes with them through the FK cascade, and the model then reports that
    // job as missing an assignment — dropped where the caller can see it,
    // rather than re-homed onto a step they did not choose.
    await this.stepModel.destroy({
      where: { scoringSubCriterionId: subCriterionId },
    })

    if (input.steps.length > 0) {
      await this.stepModel.bulkCreate(
        input.steps.map((step, index) => ({
          scoringSubCriterionId: subCriterionId,
          // Position is the þrep number. Deriving it here is what makes a gap
          // impossible rather than something the validator has to catch.
          stepOrder: index + 1,
          description: step.description,
        })),
      )
    }

    return this.reload(company, modelId)
  }

  /** Asserts the role belongs to this model, not merely that it exists. */
  private async findOwnedRole(
    modelId: string,
    roleId: string,
  ): Promise<ScoringRoleModel> {
    const role = await this.roleModel.findOne({
      where: { id: roleId, scoringModelId: modelId },
    })

    if (!role) {
      throw new NotFoundException('Starf fannst ekki í þessu starfsmati')
    }

    return role
  }

  async createRole(
    company: CompanyDto,
    modelId: string,
    input: CreateScoringRoleDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)

    await this.roleModel.create({
      scoringModelId: modelId,
      title: input.title,
    })

    return this.reload(company, modelId)
  }

  async updateRole(
    company: CompanyDto,
    modelId: string,
    roleId: string,
    input: UpdateScoringRoleDto,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    const role = await this.findOwnedRole(modelId, roleId)

    await role.update({
      ...(input.title !== undefined ? { title: input.title } : {}),
    })

    return this.reload(company, modelId)
  }

  async deleteRole(
    company: CompanyDto,
    modelId: string,
    roleId: string,
  ): Promise<ScoringModelDto> {
    await this.findOwnedModel(company, modelId)
    const role = await this.findOwnedRole(modelId, roleId)

    // The assignments go with it through the FK cascade.
    await role.destroy()

    return this.reload(company, modelId)
  }

  async setRoleStepAssignments(
    company: CompanyDto,
    modelId: string,
    roleId: string,
    input: SetScoringRoleStepAssignmentsDto,
  ): Promise<ScoringModelDto> {
    const model = await this.findOwnedModel(company, modelId)
    await this.findOwnedRole(modelId, roleId)

    // An incomplete set is reported by the validator, not refused here. An
    // incoherent one is refused: it does not describe a model that could exist,
    // so accepting it would store a row nothing could ever score.
    const stepsBySubCriterion = new Map<string, Set<string>>()
    const personalSubIds = new Set<string>()

    for (const criterion of model.criteria ?? []) {
      for (const sub of criterion.subCriteria ?? []) {
        stepsBySubCriterion.set(
          sub.id,
          new Set((sub.steps ?? []).map((step) => step.id)),
        )
        if (criterion.type === ReportCriterionTypeEnum.PERSONAL) {
          personalSubIds.add(sub.id)
        }
      }
    }

    const seen = new Set<string>()

    for (const assignment of input.assignments) {
      const steps = stepsBySubCriterion.get(assignment.subCriterionId)

      if (!steps) {
        throw new BadRequestException(
          `Undirviðmið „${assignment.subCriterionId}“ er ekki í þessu starfsmati`,
        )
      }

      if (personalSubIds.has(assignment.subCriterionId)) {
        throw new BadRequestException(
          `Undirviðmið „${assignment.subCriterionId}“ er einstaklingsbundið og er metið á starfsmann, ekki starf`,
        )
      }

      if (!steps.has(assignment.stepId)) {
        throw new BadRequestException(
          `Þrepið „${assignment.stepId}“ tilheyrir ekki undirviðmiðinu „${assignment.subCriterionId}“`,
        )
      }

      if (seen.has(assignment.subCriterionId)) {
        throw new BadRequestException(
          `Undirviðmiðið „${assignment.subCriterionId}“ kemur oftar en einu sinni fyrir; starf fær nákvæmlega eina úthlutun á hvert undirviðmið`,
        )
      }

      seen.add(assignment.subCriterionId)
    }

    await this.roleStepModel.destroy({ where: { scoringRoleId: roleId } })

    if (input.assignments.length > 0) {
      await this.roleStepModel.bulkCreate(
        input.assignments.map((assignment) => ({
          scoringRoleId: roleId,
          scoringSubCriterionId: assignment.subCriterionId,
          scoringSubCriterionStepId: assignment.stepId,
        })),
      )
    }

    return this.reload(company, modelId)
  }
}
