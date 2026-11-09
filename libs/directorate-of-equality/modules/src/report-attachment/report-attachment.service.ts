import { Transaction } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

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
  ): Promise<ReportAttachmentDto> {
    // Before anything that could reach cleanup: a key outside the boundary must
    // be a plain 400, never a read or a delete.
    this.importUploadService.assertKeyWithinBoundary(input.key, BOUNDARY)

    try {
      const row = await this.store(report, input)
      await this.importUploadService.cleanupAfter(input.key, BOUNDARY)
      return toDto(row)
    } catch (error) {
      // Deletes the staged object only when the failure is terminal for it
      // (400/413); a transient error keeps it so a retry needs no new upload.
      await this.importUploadService.cleanupAfter(input.key, BOUNDARY, error)
      throw error
    }
  }

  async remove(report: ReportModel, attachmentId: string): Promise<void> {
    this.assertAttachable(report)

    const deleted = await this.attachmentModel.destroy({
      where: { id: attachmentId, reportId: report.id },
    })

    if (deleted === 0) {
      throw new NotFoundException('Attachment not found')
    }

    this.logger.info('Removed equality report attachment', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      attachmentId,
    })
  }

  async getFile(
    reportId: string,
    attachmentId: string,
  ): Promise<ReportAttachmentFile> {
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
    input: AddReportAttachmentDto,
  ): Promise<ReportAttachmentModel> {
    this.assertAttachable(report)

    const filename = sanitizeAttachmentFilename(input.filename)
    const extension = toAttachmentExtension(extensionOf(input.key))

    if (extensionOf(filename) !== extension) {
      throw new BadRequestException(
        `The filename's extension does not match the uploaded .${extension}`,
      )
    }

    // The cap is pushed into the download, so an oversized object is never read
    // whole; it surfaces as a 413 and the object is deleted.
    const content = await this.importUploadService.fetchObject(
      input.key,
      BOUNDARY,
      MAX_REPORT_ATTACHMENT_BYTES,
    )

    assertAttachmentContent(content, extension)

    // Locked only now, after the download, so the lock is held for the count and
    // the insert rather than for an S3 round-trip. It joins the request's CLS
    // transaction, so two uploads racing for the last slot serialise here and
    // the second sees the first's row. The status is re-read under the lock: a
    // reviewer may have concluded the review during the download.
    const locked = await this.reportModel.findOne({
      where: { id: report.id },
      attributes: ['id', 'type', 'status'],
      lock: Transaction.LOCK.UPDATE,
    })
    if (!locked) {
      throw new NotFoundException('Report not found')
    }
    this.assertAttachable(locked)
    await this.assertBelowLimit(report.id)

    const row = await this.attachmentModel.create({
      reportId: report.id,
      filename,
      extension,
      sizeBytes: content.length,
      content,
    })

    this.logger.info('Added equality report attachment', {
      context: LOGGING_CONTEXT,
      reportId: report.id,
      attachmentId: row.id,
      extension,
      sizeBytes: content.length,
    })

    return row
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
