import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import {
  IApplicationService,
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

    return this.applicationService.submitSalary({ ...rest, parsed }, company)
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
