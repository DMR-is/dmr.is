import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { ReportModel } from '../report/models/report.model'
import { AddReportAttachmentDto } from './dto/add-report-attachment.dto'
import {
  GetReportAttachmentsResponseDto,
  ReportAttachmentDto,
} from './dto/report-attachment.dto'

/** An attachment's bytes plus what a download needs to serve them safely. */
export type ReportAttachmentFile = {
  filename: string
  contentType: string
  content: Buffer
}

/**
 * Supporting files (fylgiskjöl) on an equality report.
 *
 * Every method takes an already-resolved report: *who* may reach it is the
 * caller's job (the application portal's ownership lookup, or the admin
 * guards). What this service owns is the rule for *when* a report takes
 * attachments, the limits, and the file checks — one definition for every
 * caller.
 */
export interface IReportAttachmentService {
  list(reportId: string): Promise<GetReportAttachmentsResponseDto>

  /** A presigned PUT for one attachment. Refused when the report cannot take one. */
  presign(
    report: ReportModel,
    extension: string,
  ): Promise<PresignUploadResponseDto>

  /**
   * Moves a staged upload into `report_attachment` and deletes the staged
   * object. Throws 400 when the report cannot take attachments, is at the
   * limit, or the file fails its checks; 413 when it is over the size cap.
   */
  add(
    report: ReportModel,
    input: AddReportAttachmentDto,
  ): Promise<ReportAttachmentDto>

  /** Throws 404 unless the attachment belongs to `report`. */
  remove(report: ReportModel, attachmentId: string): Promise<void>

  /** Throws 404 unless the attachment belongs to `reportId`. */
  getFile(reportId: string, attachmentId: string): Promise<ReportAttachmentFile>
}

export const IReportAttachmentService = Symbol('IReportAttachmentService')
