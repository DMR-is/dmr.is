import { BelongsTo, Column, DataType, ForeignKey, HasMany } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { UserModel } from '../../user/models/user.model'
import { CompanyEmailStatusEnum } from './company-email.enums'
import { CompanyEmailAttachmentModel } from './company-email-attachment.model'
import { CompanyEmailRecipientModel } from './company-email-recipient.model'

/**
 * One admin-authored message, and the record that it was sent.
 *
 * The batch is the durable artifact, not the individual sends: per-company
 * outcomes hang off it (`CompanyEmailRecipientModel`), and so do the attachments
 * — one copy of each, because a file belongs to the message rather than to each
 * of its recipients.
 *
 * `bodyHtml` is stored already sanitised, which is what lets the preview, the
 * delivered mail and the read-back be the same bytes.
 */
type CompanyEmailAttributes = {
  subject: string
  bodyHtml: string
  createdByUserId: string
  status: CompanyEmailStatusEnum
  filter: Record<string, unknown> | null
  copyToEmail: string | null
  copySentAt: Date | null
  completedAt: Date | null
}

type CompanyEmailCreateAttributes = {
  subject: string
  bodyHtml: string
  createdByUserId: string
  status?: CompanyEmailStatusEnum
  filter?: Record<string, unknown> | null
  copyToEmail?: string | null
  copySentAt?: Date | null
  completedAt?: Date | null
}

@MutableTable({ tableName: DoeModels.COMPANY_EMAIL })
export class CompanyEmailModel extends MutableModel<
  CompanyEmailAttributes,
  CompanyEmailCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  subject!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'body_html' })
  bodyHtml!: string

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'created_by_user_id' })
  createdByUserId!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanyEmailStatusEnum)),
    allowNull: false,
    defaultValue: CompanyEmailStatusEnum.QUEUED,
  })
  status!: CompanyEmailStatusEnum

  /**
   * The company-list filter this batch was addressed by, or null when the admin
   * picked companies explicitly.
   *
   * Kept for the audit trail, not for re-execution: the register moves, so
   * re-running it would resolve a different set. The recipient rows are what
   * actually received the mail.
   */
  @Column({ type: DataType.JSONB, allowNull: true })
  filter!: Record<string, unknown> | null

  /**
   * One address that gets a copy of this message — the admin who sent it, as a
   * rule.
   *
   * One copy per batch, not a BCC on every message, which on a register-wide
   * send would deliver ~1700 identical copies to one inbox. Deliberately not a
   * `company_email_recipient` row: it belongs to no company, so it has no
   * timeline and must not be counted among the companies mailed.
   */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'copy_to_email' })
  copyToEmail!: string | null

  /**
   * When the copy went out, and the guard that it goes out only once.
   *
   * Null after a failed copy as well as before an attempted one, so a resume
   * retries it. Null on a COMPLETED batch with a `copyToEmail` set means the
   * copy never made it — the log says why.
   */
  @Column({ type: DataType.DATE, allowNull: true, field: 'copy_sent_at' })
  copySentAt!: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'completed_at' })
  completedAt!: Date | null

  @BelongsTo(() => UserModel, {
    foreignKey: 'createdByUserId',
    as: 'createdBy',
  })
  createdBy?: UserModel

  @HasMany(() => CompanyEmailRecipientModel, {
    foreignKey: 'companyEmailId',
    as: 'recipients',
  })
  recipients?: CompanyEmailRecipientModel[]

  @HasMany(() => CompanyEmailAttachmentModel, {
    foreignKey: 'companyEmailId',
    as: 'attachments',
  })
  attachments?: CompanyEmailAttachmentModel[]
}
