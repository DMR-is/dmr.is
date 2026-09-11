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
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { DraftAssignmentDto } from './dto/draft-assignment.dto'
import {
  AssignmentOwnerEnum,
  IReportDraftAssignmentService,
  PreBatchAssignment,
} from './report-draft-assignment.service.interface'

const LOGGING_CONTEXT = 'ReportDraftAssignmentService'

@Injectable()
export class ReportDraftAssignmentService
  implements IReportDraftAssignmentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly roleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly stepModel: typeof ReportSubCriterionStepModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly subCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportCriterionModel)
    private readonly criterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
  ) {}

  async getRoleSteps(
    providerId: string,
    company: CompanyDto,
    roleId: string,
  ): Promise<DraftAssignmentDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertRoleInReport(report.id, roleId)

    const rows = await this.roleStepModel.findAll({
      where: { reportEmployeeRoleId: roleId },
      attributes: ['reportSubCriterionStepId'],
    })

    return { stepIds: rows.map((row) => row.reportSubCriterionStepId) }
  }

  async setRoleSteps(
    report: ReportModel,
    roleId: string,
    stepIds: string[],
  ): Promise<void> {
    await this.assertRoleInReport(report.id, roleId)
    const resolvedStepIds = await this.assertStepsInReport(report.id, stepIds)

    // Replace-all: the join rows are immutable, so clear then recreate. Atomic
    // under the CLS request transaction.
    await this.roleStepModel.destroy({
      where: { reportEmployeeRoleId: roleId },
    })
    if (resolvedStepIds.length > 0) {
      await this.roleStepModel.bulkCreate(
        resolvedStepIds.map((stepId) => ({
          reportEmployeeRoleId: roleId,
          reportSubCriterionStepId: stepId,
        })),
      )
    }

    this.logger.info(
      `Set ${resolvedStepIds.length} step(s) on role "${roleId}"`,
      {
        context: LOGGING_CONTEXT,
        reportId: report.id,
      },
    )
  }

  async getEmployeeSteps(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<DraftAssignmentDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertEmployeeInReport(report.id, employeeId)

    const rows = await this.personalStepModel.findAll({
      where: { reportEmployeeId: employeeId },
      attributes: ['reportSubCriterionStepId'],
    })

    return { stepIds: rows.map((row) => row.reportSubCriterionStepId) }
  }

  async setEmployeeSteps(
    report: ReportModel,
    employeeId: string,
    stepIds: string[],
  ): Promise<void> {
    await this.assertEmployeeInReport(report.id, employeeId)
    const resolvedStepIds = await this.assertStepsInReport(report.id, stepIds)

    await this.personalStepModel.destroy({
      where: { reportEmployeeId: employeeId },
    })
    if (resolvedStepIds.length > 0) {
      await this.personalStepModel.bulkCreate(
        resolvedStepIds.map((stepId) => ({
          reportEmployeeId: employeeId,
          reportSubCriterionStepId: stepId,
        })),
      )
    }

    this.logger.info(
      `Set ${resolvedStepIds.length} personal step(s) on employee "${employeeId}"`,
      { context: LOGGING_CONTEXT, reportId: report.id },
    )
  }

  async snapshotAssignmentsForSteps(
    report: ReportModel,
    stepIds: string[],
  ): Promise<PreBatchAssignment[]> {
    const unique = [...new Set(stepIds)]
    if (unique.length === 0) {
      return []
    }

    const steps = await this.stepModel.findAll({
      where: { id: unique },
      attributes: ['id', 'reportSubCriterionId', 'order'],
    })
    if (steps.length === 0) {
      return []
    }

    // Pre-batch siblings of every affected sub-criterion. Captured here, with
    // the removals, because this is the last moment they are all on one scale:
    // a step UPDATE later in the batch may renumber any of them.
    const siblingRows = await this.stepModel.findAll({
      where: {
        reportSubCriterionId: [
          ...new Set(steps.map((step) => step.reportSubCriterionId)),
        ],
      },
      attributes: ['id', 'reportSubCriterionId', 'order'],
    })
    const siblingsBySub = new Map<string, { id: string; order: number }[]>()
    for (const row of siblingRows) {
      const bucket = siblingsBySub.get(row.reportSubCriterionId)
      if (bucket) {
        bucket.push({ id: row.id, order: row.order })
      } else {
        siblingsBySub.set(row.reportSubCriterionId, [
          { id: row.id, order: row.order },
        ])
      }
    }
    for (const bucket of siblingsBySub.values()) {
      bucket.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1))
    }

    const stepMeta = new Map(
      steps.map((step) => [
        step.id,
        {
          subCriterionId: step.reportSubCriterionId,
          order: step.order,
          fallbackStepIds: this.fallbackStepIds(
            siblingsBySub.get(step.reportSubCriterionId) ?? [],
            step.id,
          ),
        },
      ]),
    )
    const existingIds = [...stepMeta.keys()]

    const roleRows = await this.roleStepModel.findAll({
      where: { reportSubCriterionStepId: existingIds },
      attributes: ['reportEmployeeRoleId', 'reportSubCriterionStepId'],
    })
    const personalRows = await this.personalStepModel.findAll({
      where: { reportSubCriterionStepId: existingIds },
      attributes: ['reportEmployeeId', 'reportSubCriterionStepId'],
    })

    const snapshots: PreBatchAssignment[] = []
    for (const row of roleRows) {
      const meta = stepMeta.get(row.reportSubCriterionStepId)
      if (meta) {
        snapshots.push({
          owner: AssignmentOwnerEnum.ROLE,
          ownerId: row.reportEmployeeRoleId,
          ...meta,
        })
      }
    }
    for (const row of personalRows) {
      const meta = stepMeta.get(row.reportSubCriterionStepId)
      if (meta) {
        snapshots.push({
          owner: AssignmentOwnerEnum.EMPLOYEE,
          ownerId: row.reportEmployeeId,
          ...meta,
        })
      }
    }

    return snapshots
  }

  async clampOrphanedAssignments(
    report: ReportModel,
    snapshots: PreBatchAssignment[],
  ): Promise<void> {
    if (snapshots.length === 0) {
      return
    }

    // One target per (owner, sub-criterion). A wholesale template swap removes
    // every step of a sub-criterion, so an owner can appear several times for
    // the same sub-criterion; the highest pre-batch order wins, which keeps the
    // outcome independent of the order the commands arrived in.
    const wanted = new Map<string, PreBatchAssignment>()
    for (const snapshot of snapshots) {
      const key = this.ownerSubKey(
        snapshot.owner,
        snapshot.ownerId,
        snapshot.subCriterionId,
      )
      const existing = wanted.get(key)
      if (!existing || snapshot.order > existing.order) {
        wanted.set(key, snapshot)
      }
    }

    // Sub-criteria that survived the batch. One removed by the same batch (or
    // by its parent criterion) drops its assignments outright — no clamping.
    const subCriterionIds = [
      ...new Set([...wanted.values()].map((w) => w.subCriterionId)),
    ]
    const survivingSubs = await this.subCriterionModel.findAll({
      where: { id: subCriterionIds },
      attributes: ['id'],
    })
    if (survivingSubs.length === 0) {
      return
    }

    // Post-batch step set of each surviving sub-criterion, ascending by order.
    const stepRows = await this.stepModel.findAll({
      where: { reportSubCriterionId: survivingSubs.map((sub) => sub.id) },
      attributes: ['id', 'reportSubCriterionId', 'order'],
      order: [['order', 'ASC']],
    })
    const stepsBySub = new Map<string, { id: string; order: number }[]>()
    const subByStepId = new Map<string, string>()
    for (const step of stepRows) {
      const bucket = stepsBySub.get(step.reportSubCriterionId)
      if (bucket) {
        bucket.push({ id: step.id, order: step.order })
      } else {
        stepsBySub.set(step.reportSubCriterionId, [
          { id: step.id, order: step.order },
        ])
      }
      subByStepId.set(step.id, step.reportSubCriterionId)
    }
    if (subByStepId.size === 0) {
      return
    }

    const roleIds = [
      ...new Set(
        [...wanted.values()]
          .filter((w) => w.owner === AssignmentOwnerEnum.ROLE)
          .map((w) => w.ownerId),
      ),
    ]
    const employeeIds = [
      ...new Set(
        [...wanted.values()]
          .filter((w) => w.owner === AssignmentOwnerEnum.EMPLOYEE)
          .map((w) => w.ownerId),
      ),
    ]

    // Owners the batch removed are gone for good — re-creating a join row for
    // one would violate the FK. Scoped to the draft for the same reason
    // `setRoleSteps` is: a client-minted id must not reach another report.
    const survivingRoleIds = new Set<string>()
    if (roleIds.length > 0) {
      const rows = await this.roleModel.findAll({
        where: { id: roleIds, reportId: report.id },
        attributes: ['id'],
      })
      for (const row of rows) {
        survivingRoleIds.add(row.id)
      }
    }
    const survivingEmployeeIds = new Set<string>()
    if (employeeIds.length > 0) {
      const rows = await this.employeeModel.findAll({
        where: { id: employeeIds, reportId: report.id },
        attributes: ['id'],
      })
      for (const row of rows) {
        survivingEmployeeIds.add(row.id)
      }
    }

    // (owner, sub-criterion) pairs that already carry an assignment after the
    // batch — an explicit `stepIds` that named a surviving step, or a clamp a
    // previous sync already applied. Never assign a second step over one of
    // those; that is what makes the rule idempotent.
    const taken = new Set<string>()
    if (roleIds.length > 0) {
      const rows = await this.roleStepModel.findAll({
        where: { reportEmployeeRoleId: roleIds },
        attributes: ['reportEmployeeRoleId', 'reportSubCriterionStepId'],
      })
      for (const row of rows) {
        const subId = subByStepId.get(row.reportSubCriterionStepId)
        if (subId) {
          taken.add(
            this.ownerSubKey(
              AssignmentOwnerEnum.ROLE,
              row.reportEmployeeRoleId,
              subId,
            ),
          )
        }
      }
    }
    if (employeeIds.length > 0) {
      const rows = await this.personalStepModel.findAll({
        where: { reportEmployeeId: employeeIds },
        attributes: ['reportEmployeeId', 'reportSubCriterionStepId'],
      })
      for (const row of rows) {
        const subId = subByStepId.get(row.reportSubCriterionStepId)
        if (subId) {
          taken.add(
            this.ownerSubKey(
              AssignmentOwnerEnum.EMPLOYEE,
              row.reportEmployeeId,
              subId,
            ),
          )
        }
      }
    }

    const roleInserts: {
      reportEmployeeRoleId: string
      reportSubCriterionStepId: string
    }[] = []
    const personalInserts: {
      reportEmployeeId: string
      reportSubCriterionStepId: string
    }[] = []

    for (const [key, snapshot] of wanted) {
      if (taken.has(key)) {
        continue
      }
      const survivingSteps = stepsBySub.get(snapshot.subCriterionId)
      if (!survivingSteps || survivingSteps.length === 0) {
        continue
      }
      const target =
        this.firstSurvivingStep(snapshot.fallbackStepIds, survivingSteps) ??
        this.nearestSurvivingStep(survivingSteps, snapshot.order)
      if (!target) {
        continue
      }

      if (snapshot.owner === AssignmentOwnerEnum.ROLE) {
        if (survivingRoleIds.has(snapshot.ownerId)) {
          roleInserts.push({
            reportEmployeeRoleId: snapshot.ownerId,
            reportSubCriterionStepId: target.id,
          })
        }
      } else if (survivingEmployeeIds.has(snapshot.ownerId)) {
        personalInserts.push({
          reportEmployeeId: snapshot.ownerId,
          reportSubCriterionStepId: target.id,
        })
      }
    }

    if (roleInserts.length > 0) {
      await this.roleStepModel.bulkCreate(roleInserts)
    }
    if (personalInserts.length > 0) {
      await this.personalStepModel.bulkCreate(personalInserts)
    }

    if (roleInserts.length > 0 || personalInserts.length > 0) {
      this.logger.info(
        `Clamped ${roleInserts.length} role and ${personalInserts.length} personal assignment(s) orphaned by removed steps`,
        { context: LOGGING_CONTEXT, reportId: report.id },
      )
    }
  }

  /**
   * The removed step's pre-batch siblings in preference order: everything below
   * it, nearest first, then everything above it, nearest first. `sorted` is the
   * sub-criterion's pre-batch steps by (order, id), so "nearest" is distance in
   * that sequence — which is prefer-lower stated in identities instead of
   * numbers, and therefore immune to any renumbering the same batch applies.
   */
  private fallbackStepIds(
    sorted: { id: string; order: number }[],
    stepId: string,
  ): string[] {
    const index = sorted.findIndex((step) => step.id === stepId)
    if (index < 0) {
      return []
    }

    return [
      ...sorted.slice(0, index).reverse(),
      ...sorted.slice(index + 1),
    ].map((step) => step.id)
  }

  /**
   * The first of `candidateIds` that is still a step of the sub-criterion after
   * the batch. Undefined when none is — the wholesale template swap, where the
   * pre-batch scale is gone entirely and only `nearestSurvivingStep` can answer.
   */
  private firstSurvivingStep(
    candidateIds: string[],
    steps: { id: string; order: number }[],
  ): { id: string; order: number } | undefined {
    for (const id of candidateIds) {
      const match = steps.find((step) => step.id === id)
      if (match) {
        return match
      }
    }

    return undefined
  }

  /**
   * Prefer-lower resolution by number: the surviving step with the greatest
   * order ≤ `order`, else the smallest order > `order`.
   *
   * Preferring lower is what makes the clamp correct rather than merely
   * non-empty. Shrinking a scale removes from the top, so a role that stood on
   * the old top step lands on the new top step — full marks, which is what the
   * applicant meant. Falling to the first step would award the minimum.
   *
   * Only reached when no pre-batch sibling survived (`fallbackStepIds`), i.e. a
   * wholesale template swap, where the whole scale was replaced and the new
   * orders are the only ones there are. Everywhere else the same rule is walked
   * over identities instead, so that a batch which renumbers a survivor cannot
   * make this comparison span two different scales.
   *
   * `order` is not unique in the DB, so ties break on step id to keep the
   * result deterministic across calls.
   */
  private nearestSurvivingStep(
    steps: { id: string; order: number }[],
    order: number,
  ): { id: string; order: number } | undefined {
    let lower: { id: string; order: number } | undefined
    let higher: { id: string; order: number } | undefined

    for (const step of steps) {
      if (step.order <= order) {
        if (
          !lower ||
          step.order > lower.order ||
          (step.order === lower.order && step.id < lower.id)
        ) {
          lower = step
        }
      } else if (
        !higher ||
        step.order < higher.order ||
        (step.order === higher.order && step.id < higher.id)
      ) {
        higher = step
      }
    }

    return lower ?? higher
  }

  private ownerSubKey(
    owner: AssignmentOwnerEnum,
    ownerId: string,
    subCriterionId: string,
  ): string {
    return `${owner}:${ownerId}:${subCriterionId}`
  }

  private async assertRoleInReport(
    reportId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.roleModel.findOne({
      where: { id: roleId, reportId },
      attributes: ['id'],
    })
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`)
    }
  }

  private async assertEmployeeInReport(
    reportId: string,
    employeeId: string,
  ): Promise<void> {
    const employee = await this.employeeModel.findOne({
      where: { id: employeeId, reportId },
      attributes: ['id'],
    })
    if (!employee) {
      throw new NotFoundException(`Employee "${employeeId}" not found`)
    }
  }

  /**
   * Validates that every (deduped) step id resolves, through its sub-criterion
   * and criterion, to the given report. Returns the deduped id list. Throws 400
   * on any unknown or foreign step.
   */
  private async assertStepsInReport(
    reportId: string,
    stepIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(stepIds)]
    if (unique.length === 0) {
      return []
    }

    const steps = await this.stepModel.findAll({
      where: { id: unique },
      attributes: ['id', 'reportSubCriterionId'],
    })
    if (steps.length !== unique.length) {
      throw new BadRequestException('One or more steps do not exist')
    }

    const subIds = [...new Set(steps.map((s) => s.reportSubCriterionId))]
    const subs = await this.subCriterionModel.findAll({
      where: { id: subIds },
      attributes: ['id', 'reportCriterionId'],
    })
    const criterionIds = [...new Set(subs.map((s) => s.reportCriterionId))]

    const validCriterionCount = await this.criterionModel.count({
      where: { id: criterionIds, reportId },
    })
    if (validCriterionCount !== criterionIds.length) {
      throw new BadRequestException(
        'One or more steps do not belong to this report',
      )
    }

    return unique
  }
}
