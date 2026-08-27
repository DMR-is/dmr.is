import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftAssignmentService } from '../assignment/report-draft-assignment.service.interface'
import { IReportDraftCriterionService } from '../criterion/report-draft-criterion.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftEmployeeService } from '../employee/report-draft-employee.service.interface'
import { IReportDraftOutlierGroupService } from '../outlier-group/report-draft-outlier-group.service.interface'
import { IReportDraftRoleService } from '../role/report-draft-role.service.interface'
import { IReportDraftStepService } from '../step/report-draft-step.service.interface'
import { IReportDraftSubCriterionService } from '../sub-criterion/report-draft-sub-criterion.service.interface'
import { EmployeeChangeDataDto } from './dto/change-employee.dto'
import { SyncDraftDto } from './dto/sync-draft.dto'
import { IReportDraftSyncService } from './report-draft-sync.service.interface'
import { SyncMethodEnum } from './sync-method.enum'

const LOGGING_CONTEXT = 'ReportDraftSyncService'

/** Hard cap on employee commands per sync — the client chunks larger sets. */
const MAX_EMPLOYEE_COMMANDS = 1000

/** How many ids a prune/skip log line names before it just counts. */
const MAX_LOGGED_IDS = 10

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
    @Inject(IReportDraftAnalysisService)
    private readonly analysisService: IReportDraftAnalysisService,
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
   *   1. create/update the criteria tree (criteria → sub → steps)
   *   2. create/update roles and employees (rows only)
   *   3. apply folded step assignments (role + employee `stepIds`)
   *   4. create/update outlier groups
   *   5. clear folded outlier-group membership (`outlierGroupId: null`)
   *   6. removals, dependents first (employees → steps → sub → criteria → roles)
   *   7. derive outliers, drop stale memberships, apply sets, remove groups
   *   8. touch the report row so the prune cron sees child-only edits
   * Any failure throws and the CLS transaction rolls the whole batch back.
   * Referential integrity is enforced inline by the appliers (role/group remove
   * refuse to orphan; membership requires a detected outlier) plus DB FKs.
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

    // 5. Membership clears (no detection needed) — before group removals so an
    //    emptied group can be removed in the same batch.
    const membership = [...employees.creates, ...employees.updates].filter(
      (c) => c.data.outlierGroupId !== undefined,
    )
    for (const c of membership) {
      if (c.data.outlierGroupId === null) {
        await this.outlierGroupService.clearEmployeeGroup(report, c.id)
      }
    }

    // 6. Removals — dependents first. Outlier groups are held back to step 7:
    //    a group the recalculation has just emptied must have its stale members
    //    pruned before `removeGroup` will accept it.
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

    // 7. Outlier membership and group removals — see `applyOutlierChanges`.
    //    `touchesScoring` answers "did this batch move anything the scoring
    //    reads?": membership commands (`outlierGroupId` alone) did not,
    //    everything else did, and a batch that did must not prune.
    const touchesScoring =
      hasCommands(criteria) ||
      hasCommands(subCriteria) ||
      hasCommands(steps) ||
      hasCommands(roles) ||
      employees.creates.length > 0 ||
      employees.removes.length > 0 ||
      employees.updates.some((c) => changesScoringInput(c.data))

    const sets = membership
      .filter((c) => typeof c.data.outlierGroupId === 'string')
      .map((c) => ({
        employeeId: c.id,
        groupId: c.data.outlierGroupId as string,
      }))

    await this.applyOutlierChanges(report, sets, groups.removes, touchesScoring)

    // Everything above writes children only. Touch the report row so the
    // abandoned-draft reaper sees an actively-edited draft as active.
    await this.reportDraftService.touchDraft(report.id)

    this.logger.info(`Synced draft "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /**
   * The tail of a sync: everything that depends on who is an outlier *after*
   * the batch. Detection is derived from the persisted rows, so it can only be
   * known once every edit above has landed — the salary figures, the step
   * scores and the step assignments all move the lágmarksmengi.
   *
   * Three things happen here, in this order:
   *  1. memberships whose employee is no longer in the set are cleared, but
   *     ONLY on a batch that moved no scoring input (`touchesScoring`). The
   *     delete is irreversible applicant-authored work, and membership is a
   *     property of the SET rather than of the person (see `selectMinimumSet`),
   *     so a batch that is still rewriting the population — one chunk of a
   *     >`MAX_EMPLOYEE_COMMANDS` edit, say — would evict employees it never
   *     touched. A grouping-step flush carries no scoring input, so the state
   *     it prunes against is the one the applicant is looking at.
   *  2. the batch's own membership sets. `setEmployeeGroup` still 404s an
   *     employee or a group that is not in the draft, but reports rather than
   *     throws for an employee that is no longer an outlier — that command is
   *     stale client state (built from the previous calculation, invalidated by
   *     this very batch), and a 400 would roll back the edits that invalidated
   *     it, leaving the applicant stuck on the same error forever.
   *  3. group removals, last: `removeGroup` refuses to orphan members, so a
   *     group only reads as empty once the prune and the batch's own sets have
   *     moved everyone out of it.
   *
   * Detection is skipped when nothing needs it: no sets in the batch, and no
   * prunable membership rows on the draft.
   */
  private async applyOutlierChanges(
    report: ReportModel,
    sets: { employeeId: string; groupId: string }[],
    groupRemovals: string[],
    touchesScoring: boolean,
  ): Promise<void> {
    const memberIds = touchesScoring
      ? []
      : await this.outlierGroupService.getMemberEmployeeIds(report)

    const detected =
      sets.length > 0 || memberIds.length > 0
        ? await this.analysisService.getDetectedOutlierEmployeeIds(report.id)
        : null

    if (detected) {
      const stale = memberIds.filter((id) => !detected.has(id))
      if (stale.length > 0) {
        await this.outlierGroupService.clearEmployeeGroups(report, stale)
        this.logger.info(
          `Dropped ${stale.length} stale outlier membership(s) from draft "${report.id}" (${formatIds(stale)})`,
          { context: LOGGING_CONTEXT, reportId: report.id },
        )
      }

      const skipped: string[] = []
      for (const c of sets) {
        const applied = await this.outlierGroupService.setEmployeeGroup(
          report,
          c.employeeId,
          c.groupId,
          detected,
        )
        if (!applied) {
          skipped.push(c.employeeId)
        }
      }
      if (skipped.length > 0) {
        this.logger.info(
          `Skipped ${skipped.length} outlier-group assignment(s) for employees that are no longer outliers in draft "${report.id}" (${formatIds(skipped)})`,
          { context: LOGGING_CONTEXT, reportId: report.id },
        )
      }
    }

    for (const id of groupRemovals) {
      await this.outlierGroupService.removeGroup(report, id)
    }
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

/** Does this collection carry any command at all? */
function hasCommands<D>(partitioned: Partitioned<D>): boolean {
  return (
    partitioned.creates.length > 0 ||
    partitioned.updates.length > 0 ||
    partitioned.removes.length > 0
  )
}

/**
 * Does this employee patch move anything the scoring reads? Only
 * `outlierGroupId` does not — it records what the applicant did with an already
 * detected outlier. Keys are counted only when they carry a value, so an
 * optional field the client left unset never reads as an edit.
 */
function changesScoringInput(data: EmployeeChangeDataDto): boolean {
  return Object.entries(data).some(
    ([key, value]) => key !== 'outlierGroupId' && value !== undefined,
  )
}

/** Names the first few ids in a log line, then counts the rest. */
function formatIds(ids: string[]): string {
  if (ids.length <= MAX_LOGGED_IDS) {
    return ids.join(', ')
  }
  return `${ids.slice(0, MAX_LOGGED_IDS).join(', ')}, +${ids.length - MAX_LOGGED_IDS} more`
}
