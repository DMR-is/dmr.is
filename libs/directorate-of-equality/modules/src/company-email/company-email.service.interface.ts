import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { CompanyEmailDto } from './dto/company-email.dto'
import { CompanyEmailPreviewDto } from './dto/company-email-preview.dto'
import { DiscardCompanyEmailAttachmentDto } from './dto/discard-company-email-attachment.dto'
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
   * Drop a staged attachment the admin removed or cancelled before sending.
   *
   * Only ever for an object never submitted with a batch — once `send` has
   * accepted it, it is the message's only durable copy until
   * `archiveAttachments` runs. Best-effort and idempotent: a key that is already
   * gone is a success.
   */
  discardAttachment(dto: DiscardCompanyEmailAttachmentDto): Promise<void>

  /**
   * Resolve who this message would go to, without writing or sending anything.
   *
   * Runs the identical resolution `send` runs, so the count an admin confirms is
   * the set that will actually be written to.
   */
  preview(dto: SendCompanyEmailDto): Promise<CompanyEmailPreviewDto>

  /**
   * Record the batch and queue it.
   *
   * Returns before anything is delivered: recipients are resolved and persisted
   * inside the request, so the returned counts are truthful, and the sending is
   * handed off after the transaction commits. A register-wide send takes
   * minutes, and holding the request open would report a false failure.
   */
  send(
    dto: SendCompanyEmailDto,
    actorUserId: string,
  ): Promise<SendCompanyEmailResponseDto>

  /** A sent message, read back — backs the company timeline's expansion. */
  getById(id: string): Promise<CompanyEmailDto>
}

export const ICompanyEmailService = Symbol('ICompanyEmailService')
