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
import { ReportOutlierGroupDto } from '../../report-employee/dto/report-outlier-group.dto'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { CreateOutlierGroupDto } from './dto/create-outlier-group.dto'
import { DraftOutlierGroupDto } from './dto/draft-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './dto/employee-outlier-group.dto'
import { SetEmployeeOutlierGroupDto } from './dto/set-employee-outlier-group.dto'
import { UpdateOutlierGroupDto } from './dto/update-outlier-group.dto'
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
    @Inject(IReportDraftAnalysisService)
    private readonly analysisService: IReportDraftAnalysisService,
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

  async createGroup(
    providerId: string,
    company: CompanyDto,
    input: CreateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const explanation = resolveExplanation(input)

    const row = await this.groupModel.create({
      reportId: report.id,
      name: input.name.trim(),
      ...explanation,
    })

    this.logger.info(`Created draft outlier group "${row.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return ReportOutlierGroupModel.fromModel(row)
  }

  async updateGroup(
    providerId: string,
    company: CompanyDto,
    groupId: string,
    input: UpdateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const row = await this.findOwnedGroup(report.id, groupId)

    const patch: Partial<Explanation> & { name?: string } = {}
    if (input.name !== undefined) {
      patch.name = input.name.trim()
    }
    // The four explanation fields move as a unit — if any is present, all four
    // must be present and non-empty (keeps the row CHECK-valid).
    if (
      input.reason !== undefined ||
      input.action !== undefined ||
      input.signatureName !== undefined ||
      input.signatureRole !== undefined
    ) {
      Object.assign(patch, resolveExplanationStrict(input))
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }

    return ReportOutlierGroupModel.fromModel(row)
  }

  async deleteGroup(
    providerId: string,
    company: CompanyDto,
    groupId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const row = await this.findOwnedGroup(report.id, groupId)

    // group_id is NOT NULL on the membership rows — refuse to orphan them.
    const members = await this.outlierModel.count({ where: { groupId } })
    if (members > 0) {
      throw new ConflictException(
        `Outlier group "${groupId}" still has ${members} member(s); reassign or remove them first`,
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

  async setEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
    input: SetEmployeeOutlierGroupDto,
  ): Promise<EmployeeOutlierGroupDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertEmployeeInReport(report.id, employeeId)
    await this.findOwnedGroup(report.id, input.groupId)

    // Only a currently-detected outlier may be acknowledged into a group; the
    // submit-side guard re-checks the full detected set is covered exactly.
    const detected = await this.analysisService.getDetectedOutlierEmployeeIds(
      report.id,
    )
    if (!detected.has(employeeId)) {
      throw new BadRequestException(
        `Employee "${employeeId}" is not a detected outlier`,
      )
    }

    const existing = await this.outlierModel.findOne({
      where: { reportEmployeeId: employeeId },
    })
    if (existing) {
      await existing.update({ groupId: input.groupId })
    } else {
      await this.outlierModel.create({
        reportEmployeeId: employeeId,
        groupId: input.groupId,
      })
    }

    return { groupId: input.groupId }
  }

  async clearEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertEmployeeInReport(report.id, employeeId)

    await this.outlierModel.destroy({
      where: { reportEmployeeId: employeeId },
    })
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
  reason?: string
  action?: string
  signatureName?: string
  signatureRole?: string
}): Explanation {
  const explanation = resolveExplanation(fields)
  if (explanation.reason === null) {
    throw new BadRequestException(
      'reason, action, signatureName and signatureRole must all be provided together (non-empty)',
    )
  }
  return explanation
}
