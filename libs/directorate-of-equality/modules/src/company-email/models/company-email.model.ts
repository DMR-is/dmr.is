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
  completedAt: Date | null
}

type CompanyEmailCreateAttributes = {
  subject: string
  bodyHtml: string
  createdByUserId: string
  status?: CompanyEmailStatusEnum
  filter?: Record<string, unknown> | null
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
