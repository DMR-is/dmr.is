import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { ReportStatusEnum } from '../report/models/report.enums'
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
  /** The applicant's view: any status, drafts included. */
  list(reportId: string): Promise<GetReportAttachmentsResponseDto>

  /** The reviewer's view: 404 for a DRAFT, which reviewers cannot see. */
  listForReviewer(reportId: string): Promise<GetReportAttachmentsResponseDto>

  /** A presigned PUT for one attachment. Refused when the report cannot take one. */
  presign(
    report: ReportModel,
    extension: string,
  ): Promise<PresignUploadResponseDto>

  /**
   * Moves a staged upload into `report_attachment`; the staged object is
   * deleted once the request commits. Throws 400 when the report cannot take
   * attachments, is at the limit, or the file fails its checks; 413 when it is
   * over the size cap.
   *
   * `reportStatus` is the status read under the report's row lock — the one
   * the write was allowed under, and the one a caller should record.
   */
  add(
    report: ReportModel,
    input: AddReportAttachmentDto,
  ): Promise<{
    attachment: ReportAttachmentDto
    reportStatus: ReportStatusEnum
  }>

  /**
   * Throws 404 unless the attachment belongs to `report`. `reportStatus` as
   * for {@link add}.
   */
  remove(
    report: ReportModel,
    attachmentId: string,
  ): Promise<{ reportStatus: ReportStatusEnum }>

  /**
   * The reviewer's download. Throws 404 unless the attachment belongs to
   * `reportId` and the report is not a DRAFT.
   */
  getFile(reportId: string, attachmentId: string): Promise<ReportAttachmentFile>
}

export const IReportAttachmentService = Symbol('IReportAttachmentService')
