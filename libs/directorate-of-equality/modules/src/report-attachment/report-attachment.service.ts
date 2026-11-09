import { getNamespace } from 'cls-hooked'
import { Op, Transaction } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { AddReportAttachmentDto } from './dto/add-report-attachment.dto'
import {
  GetReportAttachmentsResponseDto,
  ReportAttachmentDto,
} from './dto/report-attachment.dto'
import {
  assertAttachmentContent,
  ATTACHMENT_CONTENT_TYPES,
  extensionOf,
  MAX_REPORT_ATTACHMENT_BYTES,
  MAX_REPORT_ATTACHMENTS,
  sanitizeAttachmentFilename,
  toAttachmentExtension,
} from './lib/attachment-file'
import {
  REPORT_ATTACHMENT_WITH_CONTENT,
  ReportAttachmentExtensionEnum,
  ReportAttachmentModel,
} from './models/report-attachment.model'
import {
  IReportAttachmentService,
  ReportAttachmentFile,
} from './report-attachment.service.interface'

const LOGGING_CONTEXT = 'ReportAttachmentService'

const BOUNDARY = ImportUploadBoundary.EQUALITY_ATTACHMENT

/**
 * The statuses in which a company may add or remove attachments: while drafting,
 * and while a reviewer has the report in review — the same window in which
 * `editEqualityContent` lets the main plan be corrected.
 */
const ATTACHABLE_STATUSES: ReadonlySet<ReportStatusEnum> = new Set([
  ReportStatusEnum.DRAFT,
  ReportStatusEnum.IN_REVIEW,
])

/**
 * Every column but `content`, for an insert that must not echo 4 MB back.
 *
 * ⚠️ **Column names, not attribute names.** Sequelize writes a `returning`
 * array into `RETURNING` verbatim, so `sizeBytes` would reach Postgres as a
 * column that does not exist; it maps the snake_case columns back onto the
 * attributes itself. Checked against the real table.
 */
const METADATA_COLUMNS = [
  'id',
  'report_id',
  'filename',
  'extension',
  'size_bytes',
  'created_at',
]

const toDto = (row: ReportAttachmentModel): ReportAttachmentDto => ({
  id: row.id,
  filename: row.filename,
  extension: row.extension,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt,
})

@Injectable()
export class ReportAttachmentService implements IReportAttachmentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
    @InjectModel(ReportAttachmentModel)
    private readonly attachmentModel: typeof ReportAttachmentModel,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
  ) {}

  async list(reportId: string): Promise<GetReportAttachmentsResponseDto> {
    // Default scope: `content` is excluded.
    const rows = await this.attachmentModel.findAll({
      where: { reportId },
      order: [['createdAt', 'ASC']],
    })

    return { attachments: rows.map(toDto) }
  }

  async listForReviewer(
    reportId: string,
  ): Promise<GetReportAttachmentsResponseDto> {
    await this.assertVisibleToReviewer(reportId)
    return this.list(reportId)
  }

  async presign(
    report: ReportModel,
    extension: string,
  ): Promise<PresignUploadResponseDto> {
    this.assertAttachable(report)
    // A presign at the limit would only fail at registration, after the upload.
    await this.assertBelowLimit(report.id)

    return this.importUploadService.createUpload(BOUNDARY, {
      extension: toAttachmentExtension(extension),
    })
  }

  async add(
    report: ReportModel,
    input: AddReportAttachmentDto,
  ): Promise<{
    attachment: ReportAttachmentDto
    reportStatus: ReportStatusEnum
  }> {
    // Before anything that could reach cleanup: a key outside the boundary must
    // be a plain 400, never a read or a delete.
    this.importUploadService.assertKeyWithinBoundary(input.key, BOUNDARY)

    // Also before the try: a mistyped filename is the caller's to correct, and
    // a 400 inside it would delete the upload they can retry with.
    const filename = sanitizeAttachmentFilename(input.filename)
    const extension = toAttachmentExtension(extensionOf(input.key))
    if (extensionOf(filename) !== extension) {
      throw new BadRequestException(
        `The filename's extension does not match the uploaded .${extension}`,
      )
    }

    try {
      const { row, reportStatus } = await this.store(
        report,
        input.key,
        filename,
        extension,
      )
      this.cleanupAfterCommit(input.key, row.id)
      return { attachment: toDto(row), reportStatus }
    } catch (error) {
      // Deletes the staged object only when the failure is terminal for it
      // (400/413); a transient error keeps it so a retry needs no new upload.
      await this.importUploadService.cleanupAfter(input.key, BOUNDARY, error)
      throw error
    }
  }

  async remove(
    report: ReportModel,
    attachmentId: string,
  ): Promise<{ reportStatus: ReportStatusEnum }> {
    this.assertAttachable(report)

    // Same lock and re-check as `add`: a delete must not land on a report a
    // reviewer decided while this request was in flight.
    const locked = await this.lockAttachable(report.id)

    const deleted = await this.attachmentModel.destroy({
      where: { id: attachmentId, reportId: report.id },
    })

    if (deleted === 0) {
      throw new NotFoundException('Attachment not found')
    }

    await this.touchIfDraft(locked)

    this.logger.info('Removed equality report attachment', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      attachmentId,
    })

    return { reportStatus: locked.status }
  }

  async getFile(
    reportId: string,
    attachmentId: string,
  ): Promise<ReportAttachmentFile> {
    await this.assertVisibleToReviewer(reportId)

    const row = await this.attachmentModel
      .scope(REPORT_ATTACHMENT_WITH_CONTENT)
      .findOne({ where: { id: attachmentId, reportId } })

    if (!row) {
      throw new NotFoundException('Attachment not found')
    }

    return {
      filename: row.filename,
      contentType: ATTACHMENT_CONTENT_TYPES[row.extension],
      content: row.content,
    }
  }

  private async store(
    report: ReportModel,
    key: string,
    filename: string,
    extension: ReportAttachmentExtensionEnum,
  ): Promise<{ row: ReportAttachmentModel; reportStatus: ReportStatusEnum }> {
    this.assertAttachable(report)

    // The cap is pushed into the download, so an oversized object is never read
    // whole; it surfaces as a 413 and the object is deleted.
    const content = await this.importUploadService.fetchObject(
      key,
      BOUNDARY,
      MAX_REPORT_ATTACHMENT_BYTES,
    )

    assertAttachmentContent(content, extension)

    // Locked only now, after the download, so the lock is held for the count and
    // the insert rather than for an S3 round-trip.
    const locked = await this.lockAttachable(report.id)
    await this.assertBelowLimit(report.id)

    const row = await this.attachmentModel.create(
      {
        reportId: report.id,
        filename,
        extension,
        sizeBytes: content.length,
        content,
      },
      // The option is typed as attribute keys, but Sequelize passes the array
      // through as column names — see METADATA_COLUMNS. The cast only satisfies
      // the type; the values are the snake_case columns.
      { returning: METADATA_COLUMNS as Array<'filename'> },
    )

    await this.touchIfDraft(locked)

    this.logger.info('Added equality report attachment', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      attachmentId: row.id,
      extension,
      sizeBytes: content.length,
    })

    return { row, reportStatus: locked.status }
  }

  /**
   * Locks the report row and re-reads its status under the lock.
   *
   * The lock joins the request's CLS transaction, so two writes racing for the
   * last slot, or a write racing a reviewer's decision, serialise here. The
   * status read under it — not the one the caller resolved earlier — is the one
   * that decides, and the one the caller records.
   */
  private async lockAttachable(reportId: string): Promise<ReportModel> {
    const locked = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['id', 'type', 'status'],
      lock: Transaction.LOCK.UPDATE,
    })
    if (!locked) {
      throw new NotFoundException('Report not found')
    }
    this.assertAttachable(locked)
    return locked
  }

  /**
   * A draft's `updated_at` is what the stale-draft reaper reads, so an
   * attachment change counts as activity — as every other draft write does
   * (`ReportDraftService.touchDraft`).
   */
  private async touchIfDraft(report: ReportModel): Promise<void> {
    if (report.status !== ReportStatusEnum.DRAFT) return

    await this.reportModel.update(
      { updatedAt: new Date() },
      { where: { id: report.id }, silent: true },
    )
  }

  /**
   * Deletes the staged object once the row is durably stored.
   *
   * Deferred to after the request's commit: the row is only real then, and an
   * error later in the request (the `EDITED` event, the commit itself) rolls it
   * back — deleting the upload before that point would leave the company
   * nothing to retry with. Sequelize also runs `afterCommit` hooks when the
   * COMMIT throws, so the hook checks, outside the transaction, that the row
   * landed before deleting anything (cf. `ReportWorkflowService.decisionLanded`).
   * If it did not, the object is left for the bucket's 24-hour lifecycle rule.
   */
  private cleanupAfterCommit(key: string, attachmentId: string): void {
    const transaction = getNamespace(CLS_NAMESPACE)?.get('transaction') as
      | Transaction
      | undefined

    const cleanup = async () => {
      try {
        const landed = await this.attachmentModel.findOne({
          where: { id: attachmentId },
          attributes: ['id'],
          transaction: null,
        })
        if (!landed) {
          this.logger.warn(
            'Keeping the staged attachment upload: its row did not commit',
            { context: LOGGING_CONTEXT, attachmentId },
          )
          return
        }
        await this.importUploadService.cleanupAfter(key, BOUNDARY)
      } catch (error) {
        // A hook has no request left to fail; the lifecycle rule is the backstop.
        this.logger.warn('Post-commit cleanup of a staged attachment failed', {
          context: LOGGING_CONTEXT,
          attachmentId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (!transaction) {
      // No ambient transaction (a unit test, or a caller outside the HTTP
      // pipeline): the insert has already autocommitted.
      void cleanup()
      return
    }

    transaction.afterCommit(cleanup)
  }

  /**
   * Drafts are invisible to reviewers — the admin report detail cannot load one
   * (it inner-joins the `company_report` snapshot a draft does not have yet) —
   * so their attachments are not served on the admin surface either.
   */
  private async assertVisibleToReviewer(reportId: string): Promise<void> {
    const visible = await this.reportModel.findOne({
      where: { id: reportId, status: { [Op.ne]: ReportStatusEnum.DRAFT } },
      attributes: ['id'],
    })

    if (!visible) {
      throw new NotFoundException('Report not found')
    }
  }

  /** Throws 400 unless `report` is an equality report in an attachable status. */
  private assertAttachable(report: ReportModel): void {
    if (report.type !== ReportTypeEnum.EQUALITY) {
      throw new BadRequestException(
        `Attachments are only accepted on an equality report, not ${report.type}`,
      )
    }

    if (!ATTACHABLE_STATUSES.has(report.status)) {
      throw new BadRequestException(
        `Cannot change attachments on a report in status ${report.status}`,
      )
    }
  }

  private async assertBelowLimit(reportId: string): Promise<void> {
    const count = await this.attachmentModel.count({ where: { reportId } })

    if (count >= MAX_REPORT_ATTACHMENTS) {
      throw new BadRequestException(
        `An equality report may carry at most ${MAX_REPORT_ATTACHMENTS} attachments`,
      )
    }
  }
}
