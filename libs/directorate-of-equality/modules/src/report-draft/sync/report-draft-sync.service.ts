import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  AssignmentOwnerEnum,
  IReportDraftAssignmentService,
  PreBatchAssignment,
} from '../assignment/report-draft-assignment.service.interface'
import { IReportDraftCriterionService } from '../criterion/report-draft-criterion.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftEmployeeService } from '../employee/report-draft-employee.service.interface'
import { IReportDraftOutlierGroupService } from '../outlier-group/report-draft-outlier-group.service.interface'
import { IReportDraftRoleService } from '../role/report-draft-role.service.interface'
import { IReportDraftStepService } from '../step/report-draft-step.service.interface'
import { IReportDraftSubCriterionService } from '../sub-criterion/report-draft-sub-criterion.service.interface'
import { EmployeeChangeDataDto } from './dto/change-employee.dto'
import { RoleChangeDataDto } from './dto/change-role.dto'
import { SyncDraftDto } from './dto/sync-draft.dto'
import { IReportDraftSyncService } from './report-draft-sync.service.interface'
import { SyncMethodEnum } from './sync-method.enum'

const LOGGING_CONTEXT = 'ReportDraftSyncService'

/** Hard cap on employee commands per sync — the client chunks larger sets. */
const MAX_EMPLOYEE_COMMANDS = 1000

/** A single tagged command, structurally shared by every collection's DTO. */
interface Command<D> {
  method: SyncMethodEnum
  id?: string
  data?: D
}

interface Partitioned<D> {
  creates: { id: string; data: D }[]
  updates: { id: string; data: D }[]
  removes: string[]
}

@Injectable()
export class ReportDraftSyncService implements IReportDraftSyncService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IReportDraftCriterionService)
    private readonly criterionService: IReportDraftCriterionService,
    @Inject(IReportDraftSubCriterionService)
    private readonly subCriterionService: IReportDraftSubCriterionService,
    @Inject(IReportDraftStepService)
    private readonly stepService: IReportDraftStepService,
    @Inject(IReportDraftRoleService)
    private readonly roleService: IReportDraftRoleService,
    @Inject(IReportDraftEmployeeService)
    private readonly employeeService: IReportDraftEmployeeService,
    @Inject(IReportDraftAssignmentService)
    private readonly assignmentService: IReportDraftAssignmentService,
    @Inject(IReportDraftOutlierGroupService)
    private readonly outlierGroupService: IReportDraftOutlierGroupService,
  ) {}

  /**
   * Applies the batch in dependency order under the request transaction:
   *   0. snapshot the assignments the batch's step removals will destroy
   *   1. create/update the criteria tree (criteria → sub → steps)
   *   2. create/update roles and employees (rows only)
   *   3. apply folded step assignments (role + employee `stepIds`)
   *   4. create/update outlier groups
   *   5. clear folded outlier-group membership (`outlierGroupId: null`)
   *   6. removals, dependents first (employees → steps → sub → criteria → roles)
   *   7. apply outlier-group membership, then remove groups
   *   8. re-home the assignments orphaned by step removals (step 0's snapshot)
   *   9. touch the report row so the prune cron sees child-only edits
   * Any failure throws and the CLS transaction rolls the whole batch back.
   * Referential integrity is enforced inline by the appliers (role/group remove
   * refuse to orphan; membership must name an employee and a group of this
   * draft) plus DB FKs.
   *
   * Steps 0 and 8 exist because a step assignment is addressed by step id, not
   * by (sub-criterion, order): removing a step used to drop every assignment
   * standing on it without a word, and the portal — which reads id → order —
   * then had nothing to fall back on but the first step, silently marking a
   * top-scoring role as 1. þrep. See `clampOrphanedAssignments` for the
   * prefer-lower rule and why it, rather than any non-empty answer, is the
   * correct one.
   *
   * Sync deliberately does NOT judge membership against the detected-outlier
   * set. Detection is derived from the whole draft and this endpoint is chunked
   * (`MAX_EMPLOYEE_COMMANDS`), so mid-batch any answer it gave would be about a
   * half-applied population — see `ReportDraftSubmitService.pruneStaleMemberships`,
   * which reconciles at submit, the one point where the draft is complete.
   */
  async syncDraft(
    providerId: string,
    company: CompanyDto,
    input: SyncDraftDto,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const criteria = this.partition(input.criteria ?? [], 'Criterion')
    const subCriteria = this.partition(input.subCriteria ?? [], 'Sub-criterion')
    const steps = this.partition(input.steps ?? [], 'Step')
    const roles = this.partition(input.roles ?? [], 'Role')
    const employees = this.partition(input.employees ?? [], 'Employee')
    const groups = this.partition(input.outlierGroups ?? [], 'Outlier group')

    const employeeCommandCount =
      employees.creates.length +
      employees.updates.length +
      employees.removes.length
    if (employeeCommandCount > MAX_EMPLOYEE_COMMANDS) {
      throw new BadRequestException(
        `A sync batch carries at most ${MAX_EMPLOYEE_COMMANDS} employee commands (got ${employeeCommandCount}); chunk the employees`,
      )
    }

    // 0. Snapshot what the step removals are about to destroy. This has to run
    //    before any write: `removeStep` destroys the join rows outright, and a
    //    folded `stepIds` in step 3 would clear them even earlier.
    //
    //    An owner whose `stepIds` this same batch sets explicitly is left out —
    //    that value is the applicant's own answer (it is how the Flokkun starfa
    //    screen saves) and must not be second-guessed by a clamp.
    const orphaned =
      steps.removes.length === 0
        ? []
        : (
            await this.assignmentService.snapshotAssignmentsForSteps(
              report,
              steps.removes,
            )
          ).filter(
            (snapshot) => !this.setsStepsExplicitly(snapshot, roles, employees),
          )

    // 1. Criteria tree — parents before children.
    for (const c of criteria.creates) {
      await this.criterionService.createCriterion(report, c.id, c.data)
    }
    for (const c of criteria.updates) {
      await this.criterionService.updateCriterion(report, c.id, c.data)
    }
    for (const c of subCriteria.creates) {
      await this.subCriterionService.createSubCriterion(report, c.id, c.data)
    }
    for (const c of subCriteria.updates) {
      await this.subCriterionService.updateSubCriterion(report, c.id, c.data)
    }
    for (const c of steps.creates) {
      await this.stepService.createStep(report, c.id, c.data)
    }
    for (const c of steps.updates) {
      await this.stepService.updateStep(report, c.id, c.data)
    }

    // 2. Roles, then employees (rows only). Employee ordinals are handed out
    //    from the current max so bulk creates don't each query max().
    for (const c of roles.creates) {
      await this.roleService.createRole(report, c.id, c.data)
    }
    for (const c of roles.updates) {
      await this.roleService.updateRole(report, c.id, c.data)
    }
    let ordinal = await this.employeeService.getMaxOrdinal(report)
    for (const c of employees.creates) {
      ordinal += 1
      await this.employeeService.createEmployee(report, c.id, c.data, ordinal)
    }
    for (const c of employees.updates) {
      await this.employeeService.updateEmployee(report, c.id, c.data)
    }

    // 3. Folded step assignments (steps + owners now exist).
    for (const c of [...roles.creates, ...roles.updates]) {
      if (c.data.stepIds !== undefined) {
        await this.assignmentService.setRoleSteps(report, c.id, c.data.stepIds)
      }
    }
    for (const c of [...employees.creates, ...employees.updates]) {
      if (c.data.stepIds !== undefined) {
        await this.assignmentService.setEmployeeSteps(
          report,
          c.id,
          c.data.stepIds,
        )
      }
    }

    // 4. Outlier groups.
    for (const c of groups.creates) {
      await this.outlierGroupService.createGroup(report, c.id, c.data)
    }
    for (const c of groups.updates) {
      await this.outlierGroupService.updateGroup(report, c.id, c.data)
    }

    // 5. Membership clears — before group removals so an emptied group can be
    //    removed in the same batch.
    const membership = [...employees.creates, ...employees.updates].filter(
      (c) => c.data.outlierGroupId !== undefined,
    )
    for (const c of membership) {
      if (c.data.outlierGroupId === null) {
        await this.outlierGroupService.clearEmployeeGroup(report, c.id)
      }
    }

    // 6. Removals — dependents first. Outlier groups are held back to step 7,
    //    after the batch's own membership sets have had their say about who is
    //    still in them.
    for (const id of employees.removes) {
      await this.employeeService.removeEmployee(report, id)
    }
    for (const id of steps.removes) {
      await this.stepService.removeStep(report, id)
    }
    for (const id of subCriteria.removes) {
      await this.subCriterionService.removeSubCriterion(report, id)
    }
    for (const id of criteria.removes) {
      await this.criterionService.removeCriterion(report, id)
    }
    for (const id of roles.removes) {
      await this.roleService.removeRole(report, id)
    }

    // 7. Membership sets, then group removals — `removeGroup` refuses to orphan
    //    members, so a group only reads as empty once the batch's own sets have
    //    moved everyone out of it.
    for (const c of membership) {
      if (typeof c.data.outlierGroupId === 'string') {
        await this.outlierGroupService.setEmployeeGroup(
          report,
          c.id,
          c.data.outlierGroupId,
        )
      }
    }
    for (const id of groups.removes) {
      await this.outlierGroupService.removeGroup(report, id)
    }

    // 8. Re-home the assignments orphaned by the step removals in step 6, to
    //    the nearest surviving step of the same sub-criterion. Resolved against
    //    the POST-batch step set, which is what lets a wholesale template swap
    //    (every step removed, a fresh set created) fall out of the same rule.
    await this.assignmentService.clampOrphanedAssignments(report, orphaned)

    // Everything above writes children only. Touch the report row so the
    // abandoned-draft reaper sees an actively-edited draft as active.
    await this.reportDraftService.touchDraft(report.id)

    this.logger.info(`Synced draft "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /**
   * Whether this batch also states the owner's assignments outright, in which
   * case the explicit value wins and the snapshot is discarded. Only a `stepIds`
   * key counts — a command that merely renames a role says nothing about its
   * classifications.
   */
  private setsStepsExplicitly(
    snapshot: PreBatchAssignment,
    roles: Partitioned<RoleChangeDataDto>,
    employees: Partitioned<EmployeeChangeDataDto>,
  ): boolean {
    const commands =
      snapshot.owner === AssignmentOwnerEnum.ROLE
        ? [...roles.creates, ...roles.updates]
        : [...employees.creates, ...employees.updates]

    return commands.some(
      (command) =>
        command.id === snapshot.ownerId && command.data.stepIds !== undefined,
    )
  }

  /**
   * Splits a collection's commands into creates/updates/removes, validating the
   * `method` ↔ `id`/`data` contract: CREATE/UPDATE need both id and data, REMOVE
   * needs an id. Client-minted ids make CREATE an idempotent upsert downstream.
   */
  private partition<D>(commands: Command<D>[], label: string): Partitioned<D> {
    const result: Partitioned<D> = { creates: [], updates: [], removes: [] }
    for (const command of commands) {
      switch (command.method) {
        case SyncMethodEnum.CREATE:
          if (!command.id || command.data === undefined) {
            throw new BadRequestException(
              `${label} CREATE requires "id" and "data"`,
            )
          }
          result.creates.push({ id: command.id, data: command.data })
          break
        case SyncMethodEnum.UPDATE:
          if (!command.id || command.data === undefined) {
            throw new BadRequestException(
              `${label} UPDATE requires "id" and "data"`,
            )
          }
          result.updates.push({ id: command.id, data: command.data })
          break
        case SyncMethodEnum.REMOVE:
          if (!command.id) {
            throw new BadRequestException(`${label} REMOVE requires "id"`)
          }
          result.removes.push(command.id)
          break
        default:
          throw new BadRequestException(
            `${label} command has an unknown method`,
          )
      }
    }
    return result
  }
}
