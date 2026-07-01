import { UniqueConstraintError } from 'sequelize'

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
} from '../../report/models/report.model'
import { CreateReportResponseDto } from '../../report-create/dto/create-report-response.dto'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { CreateDraftDto } from './dto/create-draft.dto'
import { DraftDetailDto } from './dto/draft-detail.dto'
import { UpdateDraftDto } from './dto/update-draft.dto'
import { IReportDraftService } from './report-draft.service.interface'

const LOGGING_CONTEXT = 'ReportDraftService'

/**
 * The draft surface is bound to the island.is application portal — the same
 * channel as `ApplicationController`. Other upstream channels, when they exist,
 * get their own surface.
 */
const APPLICATION_REPORT_PROVIDER = ReportProviderEnum.ISLAND_IS

/** Report-level columns the applicant may patch on a draft via `updateDraft`. */
const DRAFT_HEADER_KEYS = [
  'companyAdminName',
  'companyAdminEmail',
  'companyAdminGender',
  'contactName',
  'contactEmail',
  'contactPhone',
  'averageEmployeeMaleCount',
  'averageEmployeeFemaleCount',
  'averageEmployeeNeutralCount',
  'equalityReportContent',
] as const

@Injectable()
export class ReportDraftService implements IReportDraftService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportCriterionModel)
    private readonly reportCriterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly reportOutlierGroupModel: typeof ReportOutlierGroupModel,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly reportEmployeeRoleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly reportSubCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly reportStepModel: typeof ReportSubCriterionStepModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
  ) {}

  /**
   * Company-facing read of an in-progress draft: the report-level header plus
   * child-collection counts. The children themselves are served by their own
   * paginated list endpoints.
   */
  async getDraftDetail(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftDetailDto> {
    const report = await this.findOwnedDraft(providerId, company)

    const [employees, criteria, outlierGroups] = await Promise.all([
      this.reportEmployeeModel.count({ where: { reportId: report.id } }),
      this.reportCriterionModel.count({ where: { reportId: report.id } }),
      this.reportOutlierGroupModel.count({ where: { reportId: report.id } }),
    ])

    return {
      id: report.id,
      type: report.type,
      status: report.status,
      identifier: report.identifier,
      companyAdminName: report.companyAdminName,
      companyAdminEmail: report.companyAdminEmail,
      companyAdminGender: report.companyAdminGender,
      contactName: report.contactName,
      contactEmail: report.contactEmail,
      contactPhone: report.contactPhone,
      averageEmployeeMaleCount: report.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: report.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: report.averageEmployeeNeutralCount,
      equalityReportContent: report.equalityReportContent,
      counts: { employees, criteria, outlierGroups },
      createdAt: report.createdAt ?? null,
      updatedAt: report.updatedAt ?? null,
    }
  }

  /**
   * Patches report-level header fields on a draft (contact / admin / headcount /
   * equality narrative). PATCH semantics: only keys present in the body are
   * written — an omitted key is left untouched, an explicit `null` clears the
   * column. Returns the refreshed draft detail.
   */
  async updateDraft(
    providerId: string,
    company: CompanyDto,
    input: UpdateDraftDto,
  ): Promise<DraftDetailDto> {
    const report = await this.findOwnedDraft(providerId, company)

    const patch: UpdateDraftDto = {}
    for (const key of DRAFT_HEADER_KEYS) {
      if (input[key] !== undefined) {
        // Narrowing per-key would need a discriminated union; the key list is
        // the source of truth and each value matches its column type.
        ;(patch as Record<string, unknown>)[key] = input[key]
      }
    }

    if (Object.keys(patch).length > 0) {
      await this.reportModel.update(patch, { where: { id: report.id } })
    }

    return this.getDraftDetail(providerId, company)
  }

  /**
   * Permanently deletes a draft and everything under it. A draft has no DB-level
   * cascade, so the child tree is removed by hand in FK-safe order (leaves
   * first). A DRAFT is audit-free (no events) and has no company_report /
   * report_result snapshot yet, so those are not involved. Runs in the CLS
   * request transaction, so the whole delete is atomic.
   */
  async deleteDraft(providerId: string, company: CompanyDto): Promise<void> {
    const report = await this.findOwnedDraft(providerId, company)

    const employeeIds = (
      await this.reportEmployeeModel.findAll({
        where: { reportId: report.id },
        attributes: ['id'],
      })
    ).map((row) => row.id)
    const roleIds = (
      await this.reportEmployeeRoleModel.findAll({
        where: { reportId: report.id },
        attributes: ['id'],
      })
    ).map((row) => row.id)
    const criterionIds = (
      await this.reportCriterionModel.findAll({
        where: { reportId: report.id },
        attributes: ['id'],
      })
    ).map((row) => row.id)
    const subIds = criterionIds.length
      ? (
          await this.reportSubCriterionModel.findAll({
            where: { reportCriterionId: criterionIds },
            attributes: ['id'],
          })
        ).map((row) => row.id)
      : []
    const stepIds = subIds.length
      ? (
          await this.reportStepModel.findAll({
            where: { reportSubCriterionId: subIds },
            attributes: ['id'],
          })
        ).map((row) => row.id)
      : []

    // Leaves first: outlier + step-assignment join rows, then the entities they
    // reference, then the report row.
    if (employeeIds.length > 0) {
      await this.reportEmployeeOutlierModel.destroy({
        where: { reportEmployeeId: employeeIds },
      })
      await this.personalStepModel.destroy({
        where: { reportEmployeeId: employeeIds },
      })
    }
    if (roleIds.length > 0) {
      await this.roleStepModel.destroy({
        where: { reportEmployeeRoleId: roleIds },
      })
    }
    await this.reportOutlierGroupModel.destroy({
      where: { reportId: report.id },
    })
    if (stepIds.length > 0) {
      await this.reportStepModel.destroy({ where: { id: stepIds } })
    }
    if (subIds.length > 0) {
      await this.reportSubCriterionModel.destroy({ where: { id: subIds } })
    }
    await this.reportCriterionModel.destroy({ where: { reportId: report.id } })
    await this.reportEmployeeModel.destroy({ where: { reportId: report.id } })
    await this.reportEmployeeRoleModel.destroy({
      where: { reportId: report.id },
    })
    await this.reportModel.destroy({ where: { id: report.id } })

    this.logger.info(`Hard-deleted draft report "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /**
   * Resolves a report by the upstream `(provider_type, provider_id)` tuple and
   * asserts the authenticated company owns it AND it is still a DRAFT. Throws
   * `NotFoundException` on miss, ownership mismatch, or non-draft status — never
   * leaking the existence of another company's report, and refusing to let the
   * applicant mutate a report that has already been submitted (post-submit edits
   * go through the narrow application edit endpoints instead).
   *
   * Ownership is checked against the cached `report.company_national_id`: a
   * draft has no `company_report` snapshot yet (that is created, immutably, at
   * submit). This is the canonical resolver every draft CRUD endpoint uses.
   */
  async findOwnedDraft(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportModel> {
    const report = await this.reportModel.findOne({
      where: { providerType: APPLICATION_REPORT_PROVIDER, providerId },
    })

    if (
      !report ||
      report.status !== ReportStatusEnum.DRAFT ||
      report.companyNationalId !== company.nationalId
    ) {
      throw new NotFoundException(`Draft report "${providerId}" not found`)
    }

    return report
  }

  /**
   * Opens a bare report row in `DRAFT` status at "initial contact" — the
   * applicant has just left the prerequisites step upstream. No content exists
   * yet; the report is built up via the report-draft CRUD endpoints and
   * finalised by a later submit, which is when the criteria/employee/snapshot
   * pipeline runs.
   *
   * A DRAFT is invisible to reviewers and **emits no `report_event` rows** —
   * the audit timeline opens at submit. It also has no `company_report`
   * snapshot yet (that is frozen at submit and the model is immutable), so the
   * draft is owned via the cached `report.company_national_id` rather than the
   * parent snapshot.
   *
   * Idempotent on the `(provider_type, provider_id)` tuple: a retried initial
   * contact — or a concurrent double-fire racing the partial unique index —
   * returns the existing report instead of inserting a second draft.
   */
  async createDraft(input: CreateDraftDto): Promise<CreateReportResponseDto> {
    const replay = await this.findExistingByProviderTupleForNationalId(
      input.providerType,
      input.providerId,
      input.companyNationalId,
    )
    if (replay) {
      return replay
    }

    try {
      const report = await this.reportModel.create({
        type: input.type,
        status: ReportStatusEnum.DRAFT,
        providerType: input.providerType,
        providerId: input.providerId,
        companyNationalId: input.companyNationalId,
        importedFromExcel: false,
      })

      this.logger.info(`Created DRAFT ${input.type} report row "${report.id}"`, {
        context: LOGGING_CONTEXT,
        reportId: report.id,
      })

      return { reportId: report.id }
    } catch (error) {
      // Lost a concurrent create race for the same tuple: the partial unique
      // index on (provider_type, provider_id) rejects the second insert. Treat
      // it as a replay and return the winner.
      if (error instanceof UniqueConstraintError) {
        const winner = await this.findExistingByProviderTupleForNationalId(
          input.providerType,
          input.providerId,
          input.companyNationalId,
        )
        if (winner) {
          return winner
        }
      }
      throw error
    }
  }

  /**
   * Draft-aware replay lookup. Returns the existing `reportId` for the
   * `(provider_type, provider_id)` tuple when it is owned by `companyNationalId`,
   * otherwise null. A cross-company collision throws 409.
   *
   * A draft has no `company_report` snapshot yet, so it is owned via the cached
   * `report.company_national_id`. Submitted rows also carry that column, so
   * re-fires stay idempotent regardless of the report's current status.
   */
  private async findExistingByProviderTupleForNationalId(
    providerType: ReportProviderEnum,
    providerId: string,
    companyNationalId: string,
  ): Promise<CreateReportResponseDto | null> {
    const existing = await this.reportModel.findOne({
      where: { providerType, providerId },
    })
    if (!existing) {
      return null
    }

    if (existing.companyNationalId !== companyNationalId) {
      throw new ConflictException(
        `Provider tuple (${providerType}, "${providerId}") is already registered for a different company`,
      )
    }

    this.logger.info('Idempotent replay — returning existing draft report id', {
      context: LOGGING_CONTEXT,
      reportId: existing.id,
      providerType,
      providerId,
    })

    return { reportId: existing.id }
  }
}
