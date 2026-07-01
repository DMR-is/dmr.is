import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { DEFAULT_OUTLIER_GROUP_NAME } from '../../core/constants'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import { detectOutliers } from '../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../report/lib/employee-scores'
import {
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import { IReportContentService } from '../report-content/report-content.service.interface'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportFinalizeService } from '../report-finalize/report-finalize.service.interface'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'
import { IReportCreateService } from './report-create.service.interface'

const LOGGING_CONTEXT = 'ReportCreateService'

@Injectable()
export class ReportCreateService implements IReportCreateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly reportOutlierGroupModel: typeof ReportOutlierGroupModel,
    @Inject(IReportContentService)
    private readonly contentService: IReportContentService,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @Inject(IReportFinalizeService)
    private readonly finalizeService: IReportFinalizeService,
    @Inject(IConfigService)
    private readonly configService: IConfigService,
  ) {}

  async createSalary(input: CreateReportDto): Promise<CreateReportResponseDto> {
    return this.createSalaryReport(input)
  }

  async createEquality(
    input: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.createEqualityReport(input)
  }

  private async createSalaryReport(
    input: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    const submittingCompany = this.getSubmittingCompany(input.companies)

    // Idempotent replay — if upstream retries with the same (provider_type,
    // provider_id), return the prior reportId instead of inserting again. See
    // db/README.md → "Provider correlation".
    const replay = await this.findExistingByProviderTuple(
      input.providerType,
      input.providerId,
      submittingCompany.companyId,
    )
    if (replay) {
      return replay
    }

    const stepScoreByKey = assertParsedPayloadIntegrity(input.parsed)
    const employeeScores = computeEmployeeScores(input.parsed, stepScoreByKey)
    const detectedOrdinals = await this.computeDetectedOutlierOrdinals(
      input,
      employeeScores,
    )
    this.assertOutlierGroupsMatchDetected(input, detectedOrdinals)

    await this.finalizeService.assertEqualityReportApproved(
      input.equalityReportId,
    )

    const withdrawnReportIds = await this.finalizeService.withdrawInflightSibling(
      submittingCompany.companyId,
      ReportTypeEnum.SALARY,
    )

    const outliersPostponed = input.outliersPostponed ?? false

    // 1. report row. Status splits on the postponement choice:
    //   - outliersPostponed = false → SUBMITTED (lands in reviewer queue).
    //   - outliersPostponed = true  → POSTPONED (cannot be picked up; the
    //     applicant must resolve via PUT /application/reports/:providerId/
    //     outliers, which transitions POSTPONED → SUBMITTED).
    // See db/README.md → "Report lifecycle".
    const initialStatus = outliersPostponed
      ? ReportStatusEnum.POSTPONED
      : ReportStatusEnum.SUBMITTED
    const report = await this.reportModel.create({
      type: ReportTypeEnum.SALARY,
      status: initialStatus,
      equalityReportId: input.equalityReportId,
      identifier: input.identifier,
      importedFromExcel: input.importedFromExcel,
      providerType: input.providerType,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      companyNationalId: submittingCompany.nationalId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      averageEmployeeMaleCount: input.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: input.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: input.averageEmployeeNeutralCount,
    })

    this.logger.info(`Created SALARY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    // 2. company_report snapshots — one row per participating company.
    await this.finalizeService.createCompanyReportSnapshots(
      report.id,
      input.companies,
    )

    // 3–7. Child insertion (roles, criteria → sub-criteria → steps, role↔step
    //       joins, employees, employee↔personal-step joins). Shared with the
    //       report-draft Excel-seed path via the report-content module.
    const { employeeOrdinalToId } =
      await this.contentService.persistParsedChildren(
        report.id,
        input.parsed,
        employeeScores,
      )

    // 8. Outlier groups + outlier rows. Every detected outlier belongs to
    //    exactly one group (group_id NOT NULL):
    //      - postponed → one default group with a NULL explanation covering
    //        every detected outlier; the applicant fills it in (or splits it)
    //        later via PUT /application/reports/:providerId/outliers.
    //      - not postponed → the groups the company defined; the union of
    //        their ordinals covers the detected set exactly (validated above).
    if (detectedOrdinals.length > 0) {
      const groupsToCreate = outliersPostponed
        ? [
            {
              name: DEFAULT_OUTLIER_GROUP_NAME,
              reason: null,
              action: null,
              signatureName: null,
              signatureRole: null,
              employeeOrdinals: detectedOrdinals,
            },
          ]
        : (input.outlierGroups ?? []).map((group) => ({
            name: group.name?.trim() || DEFAULT_OUTLIER_GROUP_NAME,
            reason: group.reason,
            action: group.action,
            signatureName: group.signatureName,
            signatureRole: group.signatureRole,
            employeeOrdinals: group.employeeOrdinals,
          }))

      for (const group of groupsToCreate) {
        const groupRow = await this.reportOutlierGroupModel.create({
          reportId: report.id,
          name: group.name,
          reason: group.reason,
          action: group.action,
          signatureName: group.signatureName,
          signatureRole: group.signatureRole,
        })

        await this.reportEmployeeOutlierModel.bulkCreate(
          group.employeeOrdinals.map((ordinal: number) => ({
            // Validation above guarantees every ordinal resolves.
            reportEmployeeId: employeeOrdinalToId.get(ordinal) as string,
            groupId: groupRow.id,
          })),
        )
      }
    }

    // 9. Persisted snapshot — reviewers need the computed aggregates available
    //    immediately on the SUBMITTED row. Runs in the same CLS-managed request
    //    transaction so a snapshot failure rolls the whole submission back.
    await this.reportResultService.createForReport(report.id)

    // 10. SUBMITTED audit event — actorUserId null = company admin.
    //     reportStatus snapshots the actual landing status so the event log
    //     captures whether outliers were postponed at submit time. A later
    //     POSTPONED → SUBMITTED transition emits its own STATUS_CHANGED row.
    await this.finalizeService.emitSubmittedEvent(
      report.id,
      initialStatus,
      submittingCompany.companyId,
    )

    // 11. Soft auto-review — record what the system would decide. Audit only.
    await this.finalizeService.recordAutoReview(
      report.id,
      initialStatus,
      submittingCompany.companyId,
    )

    // 12. WITHDRAWN audit events — one per predecessor we just retired, each
    //     linked to the new report that replaced it.
    await this.finalizeService.emitWithdrawnEvents(withdrawnReportIds, report.id)

    return { reportId: report.id }
  }

  /**
   * EQUALITY submissions are narrative-only — no criteria, no employees, no
   * snapshot. Just the `report` row, the `company_report` snapshots, and the
   * SUBMITTED audit event.
   */
  private async createEqualityReport(
    input: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    const submittingCompany = this.getSubmittingCompany(input.companies)

    const replay = await this.findExistingByProviderTuple(
      input.providerType,
      input.providerId,
      submittingCompany.companyId,
    )
    if (replay) {
      return replay
    }

    const withdrawnReportIds = await this.finalizeService.withdrawInflightSibling(
      submittingCompany.companyId,
      ReportTypeEnum.EQUALITY,
    )

    const report = await this.reportModel.create({
      type: ReportTypeEnum.EQUALITY,
      status: ReportStatusEnum.SUBMITTED,
      identifier: input.identifier,
      importedFromExcel: false,
      providerType: input.providerType,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      companyNationalId: submittingCompany.nationalId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      equalityReportContent: input.equalityReportContent,
    })

    this.logger.info(`Created EQUALITY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    await this.finalizeService.createCompanyReportSnapshots(
      report.id,
      input.companies,
    )

    await this.finalizeService.emitSubmittedEvent(
      report.id,
      ReportStatusEnum.SUBMITTED,
      submittingCompany.companyId,
    )

    await this.finalizeService.recordAutoReview(
      report.id,
      ReportStatusEnum.SUBMITTED,
      submittingCompany.companyId,
    )

    await this.finalizeService.emitWithdrawnEvents(withdrawnReportIds, report.id)

    return { reportId: report.id }
  }

  /**
   * Returns the existing `reportId` if a row already exists for the
   * `(provider_type, provider_id)` tuple, otherwise returns null and the
   * caller proceeds with insert.
   *
   * Null `provider_id` (typical for `provider_type = SYSTEM` admin-created
   * rows) short-circuits with a null return — those rows are not subject to
   * the unique constraint and never replay-collide.
   *
   * Cross-company collisions (an existing row with the same tuple but a
   * different submitting company) throw 409. This shouldn't happen under
   * normal upstream behaviour but is defensible in the "new provider channel
   * reuses an existing channel's id" scenario the DB constraint guards
   * against.
   */
  private async findExistingByProviderTuple(
    providerType: ReportProviderEnum,
    providerId: string | null,
    submittingCompanyId: string,
  ): Promise<CreateReportResponseDto | null> {
    if (providerId === null) {
      return null
    }

    const existing = await this.reportModel.findOne({
      where: { providerType, providerId },
    })
    if (!existing) {
      return null
    }

    const existingParent = await this.companyReportModel.findOne({
      where: { reportId: existing.id, parentCompanyId: null },
    })
    if (!existingParent || existingParent.companyId !== submittingCompanyId) {
      throw new ConflictException(
        `Provider tuple (${providerType}, "${providerId}") is already registered for a different company`,
      )
    }

    this.logger.info('Idempotent replay — returning existing report id', {
      context: LOGGING_CONTEXT,
      reportId: existing.id,
      providerType,
      providerId,
    })

    return { reportId: existing.id }
  }

  private getSubmittingCompany(
    companies: Array<{
      companyId: string
      nationalId: string
      parentCompanyId: string | null
    }>,
  ): { companyId: string; nationalId: string } {
    const parentCompanies = companies.filter(
      (company) => company.parentCompanyId === null,
    )

    if (parentCompanies.length !== 1) {
      throw new BadRequestException(
        `Expected exactly one parent company in companies[] (parentCompanyId=null), found ${parentCompanies.length}`,
      )
    }

    return {
      companyId: parentCompanies[0].companyId,
      nationalId: parentCompanies[0].nationalId,
    }
  }

  /**
   * Recompute the canonical detected outlier set with `detectOutliers` (the
   * same helper the application-side preview uses) and return the detected
   * ordinals. Threshold is re-read from `config` here, so a tiny drift between
   * preview and submit is possible — a downstream rejection in that case just
   * means "re-run preview".
   */
  private async computeDetectedOutlierOrdinals(
    input: CreateReportDto,
    employeeScores: number[],
  ): Promise<number[]> {
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    const detected = detectOutliers({
      employees: input.parsed.employees.map((employee, index) => ({
        ordinal: employee.ordinal,
        score: employeeScores[index],
        gender: employee.gender,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
      })),
      thresholdPercent,
    })

    return detected.map((d) => d.ordinal)
  }

  /**
   * Submit-side outlier-group guard, given the canonical detected ordinals:
   *
   * - Postponed: there must be at least one detected outlier (can't postpone
   *   nothing). `outlierGroups` is ignored — a single default group with a NULL
   *   explanation is created at persist time.
   * - Not postponed: the union of every group's `employeeOrdinals` must cover
   *   the detected set exactly — no extras, no missing, and no ordinal in two
   *   groups. Explanation completeness (all four fields non-empty) is enforced
   *   by the DTO.
   */
  private assertOutlierGroupsMatchDetected(
    input: CreateReportDto,
    detectedOrdinals: number[],
  ) {
    const outliersPostponed = input.outliersPostponed ?? false
    const detectedSet = new Set(detectedOrdinals)

    if (outliersPostponed) {
      if (detectedSet.size === 0) {
        throw new BadRequestException(
          'Cannot postpone outlier explanations because this salary report has no detected outliers.',
        )
      }
      return
    }

    const groups = input.outlierGroups ?? []

    if (detectedSet.size > 0 && groups.length === 0) {
      throw new BadRequestException(
        'This salary report has detected outliers but no outlier groups were provided.',
      )
    }

    // Union of ordinals across all groups, rejecting any ordinal that appears
    // in more than one group (an outlier belongs to exactly one group).
    const submittedOrdinals = new Set<number>()
    for (const group of groups) {
      for (const ordinal of group.employeeOrdinals) {
        if (submittedOrdinals.has(ordinal)) {
          throw new BadRequestException(
            `Employee ordinal ${ordinal} appears in more than one outlier group`,
          )
        }
        submittedOrdinals.add(ordinal)
      }
    }

    const extras = [...submittedOrdinals].filter((o) => !detectedSet.has(o))
    if (extras.length > 0) {
      throw new BadRequestException(
        `Outlier group(s) reference non-outlier employee ordinal(s): ${extras.join(', ')}`,
      )
    }

    const missing = [...detectedSet].filter((o) => !submittedOrdinals.has(o))
    if (missing.length > 0) {
      throw new BadRequestException(
        `Detected outlier(s) missing from the outlier groups for employee ordinal(s): ${missing.join(', ')}`,
      )
    }
  }

  private async getSalaryDifferenceThresholdPercent(): Promise<number> {
    const config = await this.configService.getByKey(
      'salary_difference_threshold_percent',
    )
    const parsed = parseFloat(config.value)

    if (!Number.isFinite(parsed)) {
      throw new InternalServerErrorException(
        'Config entry "salary_difference_threshold_percent" must be numeric',
      )
    }

    return parsed
  }
}
