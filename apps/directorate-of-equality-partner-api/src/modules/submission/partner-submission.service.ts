import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import {
  IApplicationService,
  SubmitPartnerEqualityReportDto,
  SubmitPartnerSalaryReportDto,
} from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import { SalaryDataBasisEnum } from '@dmr.is/doe-modules/report'
import { CreateReportResponseDto } from '@dmr.is/doe-modules/report-create'
import { SalaryAnalysisResponseDto } from '@dmr.is/doe-modules/report-statistics'
import {
  IScoringModelService,
  PartnerSalaryPayloadFields,
} from '@dmr.is/doe-modules/scoring-model'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { convertEqualityDocumentToHtml } from './equality-document'

import 'multer'

const LOGGING_CONTEXT = 'PartnerSubmissionService'

/**
 * Translates this surface's payload into the one the shared submission path
 * takes, and does nothing else.
 *
 * It lives in the partner app rather than beside `ApplicationService` on
 * purpose: putting it there would make `ApplicationCoreModule` import the
 * scoring model, which would pull it into island.is's module graph for a
 * concept that channel does not have. The seam belongs to the channel that
 * needs it — the same reasoning that took `ReportExcelCoreModule` out of the
 * shared module when the workbook surface was dropped.
 *
 * Everything past the expansion is the identical code every other channel runs.
 * The submission rules, the equality gate, idempotent replay and event emission
 * are not reachable from here and cannot fork per channel.
 */
@Injectable()
export class PartnerSubmissionService {
  constructor(
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IScoringModelService)
    private readonly scoringModelService: IScoringModelService,
    @Inject(LOGGER_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async submitSalary(
    input: SubmitPartnerSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.assertSalaryDataPeriodMatchesBasis(input)

    const { scoringModelId, employees, ...rest } = input

    const parsed = await this.scoringModelService.expandToParsedPayload(
      company,
      scoringModelId,
      employees,
    )

    // The channel's own shape, not anything the vendor asked for — see
    // `SubmitSalaryOptions`. A payroll system files once and has no preview
    // step, so unexplained outliers postpone rather than refuse; and because
    // `POSTPONED` is therefore what a submission *becomes* here rather than a
    // choice someone made, a corrected re-file replaces it instead of colliding
    // with it. On island.is neither is true, and neither option is passed.
    return this.applicationService.submitSalary({ ...rest, parsed }, company, {
      postponeUnexplainedOutliers: true,
      withdrawPostponedSibling: true,
    })
  }

  /**
   * Converts the uploaded plan, then files the identical way island.is does.
   *
   * The conversion is the whole of what this channel adds. `ApplicationService`
   * receives `equalityReportContent` exactly as it does from the portal, so the
   * stored report, the reviewer's editor and the approved PDF cannot tell the
   * two channels apart — which is the point. A `.docx` is transport, not a
   * second kind of equality report.
   *
   * The original is deliberately not stored. The reviewer edits and approves the
   * HTML, so the approved HTML is the record; keeping the upload beside it would
   * create a second artefact that diverges from the approved one the moment a
   * reviewer touches it, with nothing to say which is the plan.
   */
  async submitEquality(
    input: SubmitPartnerEqualityReportDto,
    document: Express.Multer.File | undefined,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    const { html, warnings } = await convertEqualityDocumentToHtml(
      document?.buffer,
    )

    // Not returned to the vendor: an unmapped paragraph style is not something a
    // payroll system can act on, and a warning on a 201 invites a vendor to
    // treat a filed report as failed. It is logged because conversion quality
    // lands on Jafnréttisstofa's reviewers, and this is the only signal that
    // something in the plan did not survive.
    if (warnings.length > 0) {
      this.logger.warn('Equality plan converted with warnings', {
        context: LOGGING_CONTEXT,
        companyId: company.id,
        providerId: input.providerId,
        warningCount: warnings.length,
        warnings,
      })
    }

    return this.applicationService.submitEquality(
      { ...input, equalityReportContent: html },
      company,
    )
  }

  /**
   * `AVERAGE` means no month applies, so a month sent alongside it is refused
   * rather than dropped.
   *
   * `resolveSalaryDataBasis` clears it silently instead, and that is correct
   * where it lives: the same function serves the draft PATCH, where a caller
   * switching a draft from `MONTH` to `AVERAGE` legitimately sends the stale
   * month along with the new basis and expects it cleared. Rejecting there
   * would refuse an ordinary edit in the portal.
   *
   * A partner submission is not an edit. It is one shot, built by a program,
   * and a month arriving with `AVERAGE` means that program has misread the
   * field — so it is worth saying so, once, on the channel where it can only
   * be a mistake. Hence the check sits here rather than in the shared
   * resolver, and the two do not contradict each other: nothing this rejects
   * would have been stored.
   */
  private assertSalaryDataPeriodMatchesBasis(
    input: SubmitPartnerSalaryReportDto,
  ): void {
    if (
      input.salaryDataBasis === SalaryDataBasisEnum.AVERAGE &&
      input.salaryDataPeriod != null &&
      input.salaryDataPeriod.trim().length > 0
    ) {
      throw new BadRequestException(
        'salaryDataPeriod must be omitted when salaryDataBasis is AVERAGE — an average covers twelve months, so there is no single month to name',
      )
    }
  }

  /**
   * The same expansion, so a payload that previews clean is the payload that
   * gets filed. Running the analysis over a differently-built tree would make
   * the preview answer a question the submission never asks.
   */
  async salaryAnalysis(
    input: PartnerSalaryPayloadFields,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    const parsed = await this.scoringModelService.expandToParsedPayload(
      company,
      input.scoringModelId,
      input.employees,
    )

    return this.applicationService.salaryAnalysis({ parsed }, company)
  }
}
