import { getNamespace } from 'cls-hooked'
import { Transaction } from 'sequelize'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import {
  EqualityContentInput,
  MAX_EQUALITY_PDF_BYTES,
} from '../report/lib/equality-content'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import {
  IEqualityPlanUploadService,
  StagedEqualityContentInput,
} from './equality-plan-upload.service.interface'

const LOGGING_CONTEXT = 'EqualityPlanUploadService'

const BOUNDARY = ImportUploadBoundary.EQUALITY_PLAN

/**
 * Where a company may replace its plan: while drafting (draft PATCH) and while
 * a reviewer has asked for changes (`PUT equality-content`). Same window as
 * the fylgiskjöl.
 */
const REPLACEABLE_STATUSES: ReadonlySet<ReportStatusEnum> = new Set([
  ReportStatusEnum.DRAFT,
  ReportStatusEnum.IN_REVIEW,
])

const isPresent = (value?: string | null): value is string =>
  typeof value === 'string' && value.trim().length > 0

@Injectable()
export class EqualityPlanUploadService implements IEqualityPlanUploadService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
  ) {}

  async presign(report: ReportModel): Promise<PresignUploadResponseDto> {
    if (report.type !== ReportTypeEnum.EQUALITY) {
      throw new BadRequestException(
        `An equality plan can only be uploaded to an equality report, not ${report.type}`,
      )
    }

    if (!REPLACEABLE_STATUSES.has(report.status)) {
      throw new BadRequestException(
        `Cannot change the equality plan on a report in status ${report.status}`,
      )
    }

    // Scoped to the report: the key is a bearer credential, and the stored plan
    // can be read back by whoever registers it, so a key must not be
    // registrable on any other report.
    return this.importUploadService.createUpload(BOUNDARY, {
      extension: 'pdf',
      scope: report.id,
    })
  }

  async withStagedPlan<T>(
    reportId: string,
    input: StagedEqualityContentInput,
    write: (content: EqualityContentInput | null) => Promise<T>,
  ): Promise<T> {
    // `registeredPdfKey` is dropped whatever the caller sent: only this method
    // may say which key a PDF came from.
    const {
      equalityReportPdfKey: key,
      registeredPdfKey: _ignored,
      ...inline
    } = input

    if (!isPresent(key)) {
      return write(inline)
    }

    /*
     * Everything that is the caller's to correct is checked before the try:
     * a 400 inside it is terminal for the upload and would delete the object
     * the caller could otherwise resend with a fixed request.
     */
    // Also the report check: a key minted for another report — another
    // company's, if it leaked — is a 400 here, before anything is read.
    this.importUploadService.assertKeyWithinBoundary(key, BOUNDARY, reportId)

    if (
      isPresent(inline.equalityReportPdf) ||
      isPresent(inline.equalityReportContent)
    ) {
      throw new BadRequestException(
        'Provide either equalityReportPdfKey or equalityReportPdf/equalityReportContent, not both',
      )
    }

    if (!isPresent(inline.equalityReportPdfFilename)) {
      throw new BadRequestException(
        'equalityReportPdfFilename is required when submitting a PDF',
      )
    }

    /*
     * A resend of the key that delivered the plan the report holds now: the
     * first request succeeded and its response was lost, so the client
     * retried. Its object is gone, so the fetch below could only fail; answer
     * it as the success it was and leave the plan alone. After the scope check
     * on purpose — this never answers for another report's key — and keyed on
     * the column every other plan write clears, so a key whose plan has since
     * been replaced is not a replay.
     */
    const alreadyStored = await this.reportModel.findOne({
      where: { id: reportId, equalityReportPdfKey: key },
      attributes: ['id'],
    })
    if (alreadyStored) {
      this.logger.info('Equality plan key resent after it was registered', {
        context: LOGGING_CONTEXT,
        reportId,
      })
      return write(null)
    }

    try {
      // The cap is pushed into the download; an oversized object is a 413 and
      // `fetchObject` deletes it itself.
      const bytes = await this.importUploadService.fetchObject(
        key,
        BOUNDARY,
        MAX_EQUALITY_PDF_BYTES,
      )

      // Checked here because base64 of nothing is '', which the inline rules
      // would report as "no content supplied" — the wrong thing to fix.
      if (bytes.length === 0) {
        throw new BadRequestException(
          'The uploaded equality report PDF is empty',
        )
      }

      const pdf = bytes.toString('base64')

      // `write` runs `resolveEqualityContent`, so size and signature are
      // checked by the same code as an inline base64 plan.
      const result = await write({
        equalityReportContent: undefined,
        equalityReportPdf: pdf,
        equalityReportPdfFilename: inline.equalityReportPdfFilename,
        registeredPdfKey: key,
      })

      this.cleanupAfterCommit(key, reportId)

      this.logger.info('Registered equality plan PDF from staged upload', {
        context: LOGGING_CONTEXT,
        reportId,
        sizeBytes: bytes.length,
      })

      return result
    } catch (error) {
      // Deletes only when the failure is terminal for the object (400/413); a
      // transient error keeps it so a retry needs no new upload.
      await this.importUploadService.cleanupAfter(key, BOUNDARY, error)
      throw error
    }
  }

  /**
   * Deletes the staged object once the plan is durably stored.
   *
   * After commit, not now: a later error in the request rolls the write back,
   * and the company would be left with nothing to retry with. Sequelize also
   * runs `afterCommit` hooks when COMMIT throws, so the hook checks outside
   * the transaction that the row holds the plan this key delivered before
   * deleting. If it does not, the object is left for the bucket's 24-hour
   * lifecycle rule.
   */
  private cleanupAfterCommit(key: string, reportId: string): void {
    const transaction = getNamespace(CLS_NAMESPACE)?.get('transaction') as
      | Transaction
      | undefined

    const cleanup = async () => {
      try {
        // The key column is written with the plan and cleared by every other
        // plan write, so it names exactly the commit this hook is for.
        const landed = await this.reportModel.findOne({
          where: { id: reportId, equalityReportPdfKey: key },
          attributes: ['id'],
          transaction: null,
        })

        if (!landed) {
          this.logger.warn(
            'Keeping the staged equality plan upload: the plan did not commit',
            { context: LOGGING_CONTEXT, reportId },
          )
          return
        }

        await this.importUploadService.cleanupAfter(key, BOUNDARY)
      } catch (error) {
        // A hook has no request left to fail; the lifecycle rule is the backstop.
        this.logger.warn(
          'Post-commit cleanup of a staged equality plan failed',
          {
            context: LOGGING_CONTEXT,
            reportId,
            error: error instanceof Error ? error.message : String(error),
          },
        )
      }
    }

    if (!transaction) {
      // No ambient transaction (a unit test, or a caller outside the HTTP
      // pipeline): the write has already autocommitted.
      void cleanup()
      return
    }

    transaction.afterCommit(cleanup)
  }
}
