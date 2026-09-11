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
 * The batch is the durable artifact, not the individual sends: an admin writes
 * one email and it goes to between one and every company on the register. The
 * per-company outcomes hang off it (`CompanyEmailRecipientModel`), and so do the
 * attachments — one copy of each, because a file attached to this message is a
 * property of the message and not of each of its 1 700 recipients.
 *
 * `subject` and `bodyHtml` are stored so the timeline can show what was sent
 * rather than only that something was. `bodyHtml` is stored **already
 * sanitised**, which is what lets the preview, the delivered mail and the
 * read-back be the same bytes rather than three passes that could disagree.
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
   * Kept for the audit trail rather than for re-execution: re-running it later
   * would resolve a *different* set, since the register moves. What actually
   * received the mail is the recipient rows; this records what the admin
   * believed they were selecting when they sent it.
   */
  @Column({ type: DataType.JSONB, allowNull: true })
  filter!: Record<string, unknown> | null

  /**
   * One address that gets a copy of this message — the admin who sent it, as a
   * rule.
   *
   * ⚠️ **One copy per batch, not a BCC on every message.** A real BCC header on
   * a send addressed at the whole register would deliver ~1 700 identical
   * copies to one inbox. This is the whole recipient list for the copy, and it
   * is deliberately not a `company_email_recipient` row: it belongs to no
   * company, so it has no timeline to be written to and must not be counted
   * among the companies that were mailed.
   */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'copy_to_email' })
  copyToEmail!: string | null

  /**
   * When the copy went out, and the guard that it goes out only once.
   *
   * ⚠️ Null after a *failed* copy as well as before an attempted one, which is
   * deliberate: a resumed batch retries it. Null with a COMPLETED batch and a
   * non-null `copyToEmail` therefore means the copy never made it — the log
   * says why.
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
