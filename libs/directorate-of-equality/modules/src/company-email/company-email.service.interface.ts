import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { CompanyEmailDto } from './dto/company-email.dto'
import { CompanyEmailPreviewDto } from './dto/company-email-preview.dto'
import { PresignCompanyEmailAttachmentDto } from './dto/presign-company-email-attachment.dto'
import { SendCompanyEmailDto } from './dto/send-company-email.dto'
import { SendCompanyEmailResponseDto } from './dto/send-company-email-response.dto'

export interface ICompanyEmailService {
  /**
   * Staging target for one attachment. The client PUTs the file straight to the
   * returned URL, then passes the `key` back with the send.
   */
  presignAttachment(
    dto: PresignCompanyEmailAttachmentDto,
  ): Promise<PresignUploadResponseDto>

  /**
   * Resolve who this message would go to, without writing or sending anything.
   *
   * ⚠️ Runs the identical resolution `send` runs, which is the only reason the
   * preview is worth showing: an admin confirming a count is confirming the set
   * that will actually be written to, not an estimate of it.
   */
  preview(dto: SendCompanyEmailDto): Promise<CompanyEmailPreviewDto>

  /**
   * Record the batch and queue it.
   *
   * ⚠️ **Returns before anything is delivered.** Recipients are resolved and
   * persisted inside the request — so the returned counts are truthful about
   * what was queued — and the sending itself is handed off after the
   * transaction commits. A send addressed at the whole register takes minutes;
   * holding the request open for it would time out and report a false failure
   * for mail that went out perfectly well.
   */
  send(
    dto: SendCompanyEmailDto,
    actorUserId: string,
  ): Promise<SendCompanyEmailResponseDto>

  /** A sent message, read back — backs the company timeline's expansion. */
  getById(id: string): Promise<CompanyEmailDto>
}

export const ICompanyEmailService = Symbol('ICompanyEmailService')
