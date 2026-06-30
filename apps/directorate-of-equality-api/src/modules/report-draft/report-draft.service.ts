import { UniqueConstraintError } from 'sequelize'

import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
} from '../report/models/report.model'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { CreateDraftDto } from './dto/create-draft.dto'
import { IReportDraftService } from './report-draft.service.interface'

const LOGGING_CONTEXT = 'ReportDraftService'

@Injectable()
export class ReportDraftService implements IReportDraftService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
  ) {}

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
