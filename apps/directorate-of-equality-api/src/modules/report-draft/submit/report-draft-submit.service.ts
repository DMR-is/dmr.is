import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../../company/company.service.interface'
import { CompanyDto } from '../../company/dto/company.dto'
import { ReportStatusEnum, ReportTypeEnum } from '../../report/models/report.model'
import { CreateReportCompanySnapshotDto } from '../../report-create/dto/create-report.dto'
import { CreateReportResponseDto } from '../../report-create/dto/create-report-response.dto'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportFinalizeService } from '../../report-finalize/report-finalize.service.interface'
import { IReportResultService } from '../../report-result/report-result.service.interface'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { SubmitDraftDto } from './dto/submit-draft.dto'
import { IReportDraftSubmitService } from './report-draft-submit.service.interface'

const LOGGING_CONTEXT = 'ReportDraftSubmitService'

@Injectable()
export class ReportDraftSubmitService implements IReportDraftSubmitService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IReportDraftAnalysisService)
    private readonly analysisService: IReportDraftAnalysisService,
    @Inject(IReportFinalizeService)
    private readonly finalizeService: IReportFinalizeService,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly outlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly outlierGroupModel: typeof ReportOutlierGroupModel,
  ) {}

  async submitDraft(
    providerId: string,
    company: CompanyDto,
    input: SubmitDraftDto,
  ): Promise<CreateReportResponseDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const isSalary = report.type === ReportTypeEnum.SALARY

    if (isSalary && !input.equalityReportId) {
      throw new BadRequestException(
        'equalityReportId is required to submit a salary report',
      )
    }

    // Snapshot company details (frozen at submit) — validate parent matches the
    // authenticated company and resolve subsidiaries.
    const companies = await this.buildCompanySnapshots(input, company)

    if (isSalary && input.equalityReportId) {
      await this.finalizeService.assertEqualityReportApproved(
        input.equalityReportId,
      )
    }

    // Retire any still-SUBMITTED sibling of the same type before this one takes
    // its place (409s if a sibling is IN_REVIEW/POSTPONED). The draft has no
    // company_report yet, so it is not seen as its own sibling.
    const withdrawnReportIds = await this.finalizeService.withdrawInflightSibling(
      company.id,
      report.type,
    )

    await this.finalizeService.createCompanyReportSnapshots(report.id, companies)

    let status = ReportStatusEnum.SUBMITTED
    if (isSalary) {
      // Freeze scores, then the result snapshot (which reads them), then decide
      // SUBMITTED vs POSTPONED from the outlier explanation state.
      await this.analysisService.persistScores(report.id)
      await this.reportResultService.createForReport(report.id)
      status = await this.resolveSalaryOutlierStatus(report.id)
    }

    await report.update({
      status,
      equalityReportId: input.equalityReportId ?? null,
    })

    await this.finalizeService.emitSubmittedEvent(report.id, status, company.id)
    await this.finalizeService.recordAutoReview(report.id, status, company.id)
    await this.finalizeService.emitWithdrawnEvents(withdrawnReportIds, report.id)

    this.logger.info(`Submitted draft report "${report.id}" as ${status}`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return { reportId: report.id }
  }

  /**
   * Validates the persisted outlier grouping against the freshly-detected
   * outlier set and returns the landing status:
   *  - every detected outlier must be assigned to a group, and no non-detected
   *    employee may be (400 otherwise);
   *  - referenced groups must be uniformly explained (→ SUBMITTED) or uniformly
   *    unexplained (→ POSTPONED); a mix is rejected.
   * No detected outliers → SUBMITTED.
   */
  private async resolveSalaryOutlierStatus(
    reportId: string,
  ): Promise<ReportStatusEnum> {
    const detected =
      await this.analysisService.getDetectedOutlierEmployeeIds(reportId)

    const employeeIds = (
      await this.employeeModel.findAll({
        where: { reportId },
        attributes: ['id'],
      })
    ).map((row) => row.id)

    const memberships = employeeIds.length
      ? await this.outlierModel.findAll({
          where: { reportEmployeeId: employeeIds },
          attributes: ['reportEmployeeId', 'groupId'],
        })
      : []
    const assignedIds = new Set(memberships.map((m) => m.reportEmployeeId))

    const missing = [...detected].filter((id) => !assignedIds.has(id))
    if (missing.length > 0) {
      throw new BadRequestException(
        `Every detected outlier must be assigned to an outlier group before submitting (${missing.length} unassigned)`,
      )
    }
    const extra = [...assignedIds].filter((id) => !detected.has(id))
    if (extra.length > 0) {
      throw new BadRequestException(
        `Only detected outliers may be assigned to outlier groups (${extra.length} non-outlier assignment(s))`,
      )
    }

    if (detected.size === 0) {
      return ReportStatusEnum.SUBMITTED
    }

    const groupIds = [...new Set(memberships.map((m) => m.groupId))]
    const groups = await this.outlierGroupModel.findAll({
      where: { id: groupIds },
      attributes: ['id', 'reason'],
    })
    const explained = groups.filter((g) => g.reason !== null).length

    if (explained === 0) {
      // All acknowledged, none explained yet → postponed.
      return ReportStatusEnum.POSTPONED
    }
    if (explained === groups.length) {
      return ReportStatusEnum.SUBMITTED
    }
    throw new BadRequestException(
      'Outlier groups must be either all explained (submit) or all unexplained (postpone)',
    )
  }

  /**
   * Builds the company_report snapshot input from the submit payload: the
   * parent (must match the authenticated company) plus resolved subsidiaries.
   * Mirrors the application-portal submit mapping.
   */
  private async buildCompanySnapshots(
    input: SubmitDraftDto,
    company: CompanyDto,
  ): Promise<CreateReportCompanySnapshotDto[]> {
    const parentNationalId = input.company.nationalId.trim()
    if (parentNationalId !== company.nationalId) {
      throw new BadRequestException(
        'Submitted parent company does not match the authenticated company',
      )
    }

    const subsidiaries = (input.subsidiaries ?? []).map((subsidiary) => ({
      name: subsidiary.name,
      nationalId: subsidiary.nationalId.trim(),
    }))

    const seen = new Set([parentNationalId])
    for (const subsidiary of subsidiaries) {
      if (subsidiary.nationalId === parentNationalId) {
        throw new BadRequestException(
          `Subsidiary "${subsidiary.nationalId}" cannot be the authenticated parent company`,
        )
      }
      if (seen.has(subsidiary.nationalId)) {
        throw new BadRequestException(
          `Duplicate subsidiary national id "${subsidiary.nationalId}"`,
        )
      }
      seen.add(subsidiary.nationalId)
    }

    const subsidiarySnapshots = await Promise.all(
      subsidiaries.map(async (subsidiary) => {
        const source =
          await this.companyService.getOrCreateSubsidiaryReportSnapshotSource(
            subsidiary,
          )
        return { ...source, parentCompanyId: company.id }
      }),
    )

    return [
      {
        companyId: company.id,
        parentCompanyId: null,
        name: input.company.name,
        nationalId: parentNationalId,
        address: input.company.address,
        city: input.company.city,
        postcode: input.company.postcode,
        isatCategory: input.company.isatCategory,
      },
      ...subsidiarySnapshots,
    ]
  }
}
