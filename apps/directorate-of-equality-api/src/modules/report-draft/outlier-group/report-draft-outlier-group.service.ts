import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { OutlierGroupChangeDataDto } from '../sync/dto/change-outlier-group.dto'
import { DraftOutlierGroupDto } from './dto/draft-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './dto/employee-outlier-group.dto'
import { IReportDraftOutlierGroupService } from './report-draft-outlier-group.service.interface'

const LOGGING_CONTEXT = 'ReportDraftOutlierGroupService'

type Explanation = {
  reason: string | null
  action: string | null
  signatureName: string | null
  signatureRole: string | null
}

@Injectable()
export class ReportDraftOutlierGroupService
  implements IReportDraftOutlierGroupService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @InjectModel(ReportOutlierGroupModel)
    private readonly groupModel: typeof ReportOutlierGroupModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly outlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
  ) {}

  // ── Groups ──────────────────────────────────────────────────────────────

  async listGroups(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftOutlierGroupDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const groups = await this.groupModel.findAll({
      where: { reportId: report.id },
      order: [['createdAt', 'ASC']],
    })
    if (groups.length === 0) {
      return []
    }

    const members = await this.outlierModel.findAll({
      where: { groupId: groups.map((g) => g.id) },
      attributes: ['reportEmployeeId', 'groupId'],
    })
    const byGroup = new Map<string, string[]>()
    for (const member of members) {
      const list = byGroup.get(member.groupId)
      if (list) {
        list.push(member.reportEmployeeId)
      } else {
        byGroup.set(member.groupId, [member.reportEmployeeId])
      }
    }

    return groups.map((group) => ({
      ...ReportOutlierGroupModel.fromModel(group),
      memberEmployeeIds: byGroup.get(group.id) ?? [],
    }))
  }

  /**
   * Upserts an outlier group from a sync CREATE command. The id is the
   * client-minted PK, so a repeated CREATE (retry) updates in place rather than
   * duplicating. A client id that already belongs to a different report is
   * rejected.
   */
  async createGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void> {
    const name = data.name?.trim()
    if (!name) {
      throw new BadRequestException('Outlier group CREATE requires a name')
    }
    const explanation = resolveExplanation(data)

    const existing = await this.groupModel.findByPk(id)
    if (existing) {
      if (existing.reportId !== report.id) {
        throw new BadRequestException(
          `Outlier group "${id}" belongs to a different report`,
        )
      }
      await existing.update({ name, ...explanation })
      return
    }

    // `id` is deliberately excluded from ReportOutlierGroupCreateAttributes,
    // so it must be cast through — passing it here (rather than assigning
    // `row.id` after `.build()`) is required for the client-minted id to
    // actually stick; a post-build assignment silently gets clobbered by the
    // column's `defaultValue: UUIDV4` before `.save()`.
    const row = this.groupModel.build({
      id,
      reportId: report.id,
      name,
      ...explanation,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    await row.save()

    this.logger.info(`Synced draft outlier group "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches an outlier group from a sync UPDATE command (PATCH semantics). */
  async updateGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedGroup(report.id, id)

    const patch: Partial<Explanation> & { name?: string } = {}
    if (data.name !== undefined) {
      patch.name = data.name.trim()
    }
    // The four explanation fields move as a unit — if any is present, all four
    // must be present and non-empty (keeps the row CHECK-valid).
    if (
      data.reason !== undefined ||
      data.action !== undefined ||
      data.signatureName !== undefined ||
      data.signatureRole !== undefined
    ) {
      Object.assign(patch, resolveExplanationStrict(data))
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }
  }

  /** Removes an outlier group. Refuses to orphan employees still in it. */
  async removeGroup(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedGroup(report.id, id)

    // group_id is NOT NULL on the membership rows — refuse to orphan them.
    const members = await this.outlierModel.count({ where: { groupId: id } })
    if (members > 0) {
      throw new ConflictException(
        `Outlier group "${id}" still has ${members} member(s); reassign or remove them first`,
      )
    }

    await row.destroy()
  }

  // ── Membership (per employee) ─────────────────────────────────────────────

  async getEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<EmployeeOutlierGroupDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertEmployeeInReport(report.id, employeeId)

    const row = await this.outlierModel.findOne({
      where: { reportEmployeeId: employeeId },
      attributes: ['groupId'],
    })

    return { groupId: row?.groupId ?? null }
  }

  /**
   * Upserts an employee's outlier-group membership from a sync command. Both
   * the employee and the group are validated against the draft (404 either
   * way); the detected-outlier set is derived once by the caller and passed in.
   *
   * Returns `false`, writing nothing, when the employee is not currently an
   * outlier. That is deliberately not a 400: the applicant's client built the
   * command from the previous calculation and the same batch carries the edits
   * that invalidated it, so rejecting would roll those edits back and leave the
   * applicant looping on the same error. The caller decides what to report.
   */
  async setEmployeeGroup(
    report: ReportModel,
    employeeId: string,
    groupId: string,
    detectedIds: Set<string>,
  ): Promise<boolean> {
    await this.assertEmployeeInReport(report.id, employeeId)
    await this.findOwnedGroup(report.id, groupId)

    if (!detectedIds.has(employeeId)) {
      return false
    }

    const existing = await this.outlierModel.findOne({
      where: { reportEmployeeId: employeeId },
    })
    if (existing) {
      await existing.update({ groupId })
    } else {
      await this.outlierModel.create({
        reportEmployeeId: employeeId,
        groupId,
      })
    }

    return true
  }

  async clearEmployeeGroup(
    report: ReportModel,
    employeeId: string,
  ): Promise<void> {
    await this.assertEmployeeInReport(report.id, employeeId)

    await this.clearEmployeeGroups(report, [employeeId])
  }

  /** The report's employees that currently sit in an outlier group. */
  async getMemberEmployeeIds(report: ReportModel): Promise<string[]> {
    const groupIds = await this.getGroupIds(report.id)
    if (groupIds.length === 0) {
      return []
    }

    const rows = await this.outlierModel.findAll({
      where: { groupId: groupIds },
      attributes: ['reportEmployeeId'],
    })

    return rows.map((row) => row.reportEmployeeId)
  }

  /**
   * Bulk-clears membership for the given employees — the delete every clearing
   * path goes through. Scoped through the report's own groups, so an id from
   * another report can never delete a row here; the singular entry point adds
   * the 404 on an employee that is not in the draft.
   */
  async clearEmployeeGroups(
    report: ReportModel,
    employeeIds: string[],
  ): Promise<void> {
    if (employeeIds.length === 0) {
      return
    }
    const groupIds = await this.getGroupIds(report.id)
    if (groupIds.length === 0) {
      return
    }

    await this.outlierModel.destroy({
      where: { reportEmployeeId: employeeIds, groupId: groupIds },
    })
  }

  private async getGroupIds(reportId: string): Promise<string[]> {
    const groups = await this.groupModel.findAll({
      where: { reportId },
      attributes: ['id'],
    })
    return groups.map((group) => group.id)
  }

  private async findOwnedGroup(
    reportId: string,
    groupId: string,
  ): Promise<ReportOutlierGroupModel> {
    const row = await this.groupModel.findOne({
      where: { id: groupId, reportId },
    })
    if (!row) {
      throw new NotFoundException(`Outlier group "${groupId}" not found`)
    }
    return row
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
}

/**
 * Create-side explanation resolution: all four fields present and non-empty
 * (explained) or none present (NULL block). A partial set throws 400.
 */
function resolveExplanation(fields: {
  reason?: string | null
  action?: string | null
  signatureName?: string | null
  signatureRole?: string | null
}): Explanation {
  const reason = fields.reason?.trim() ?? ''
  const action = fields.action?.trim() ?? ''
  const signatureName = fields.signatureName?.trim() ?? ''
  const signatureRole = fields.signatureRole?.trim() ?? ''
  const filledCount = [reason, action, signatureName, signatureRole].filter(
    (v) => v.length > 0,
  ).length

  if (filledCount === 0) {
    return { reason: null, action: null, signatureName: null, signatureRole: null }
  }
  if (filledCount === 4) {
    return { reason, action, signatureName, signatureRole }
  }
  throw new BadRequestException(
    'reason, action, signatureName and signatureRole must all be provided together (non-empty) or all omitted',
  )
}

/** Update-side: the explanation block was touched, so all four must be set. */
function resolveExplanationStrict(fields: {
  reason?: string | null
  action?: string | null
  signatureName?: string | null
  signatureRole?: string | null
}): Explanation {
  const explanation = resolveExplanation(fields)
  if (explanation.reason === null) {
    throw new BadRequestException(
      'reason, action, signatureName and signatureRole must all be provided together (non-empty)',
    )
  }
  return explanation
}
