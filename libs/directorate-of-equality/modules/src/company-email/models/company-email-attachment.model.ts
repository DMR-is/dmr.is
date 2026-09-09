import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { CompanyEmailModel } from './company-email.model'

/**
 * One file attached to a batch — **one row per file, not per recipient**.
 *
 * ⚠️ That distinction is the whole reason this is not filed through
 * `ICompanyFileService`. That service keys documents under the owning company
 * (`company-files/{nationalId}/…`), which is exactly right for an approval — one
 * company, one PDF — but a 1 700-recipient send would write 1 700 copies of the
 * same file. An attachment belongs to the *message*, which is one artifact sent
 * to many, and each company reaches it through its timeline event → batch →
 * attachment.
 *
 * `s3Key` moves once over the row's life: it points at the staging prefix while
 * the batch is queued and sending, and at the durable company-files prefix
 * afterwards. `archived` says which, so a reader never has to guess which bucket
 * the key belongs to.
 */
type CompanyEmailAttachmentAttributes = {
  companyEmailId: string
  filename: string
  s3Key: string
  sizeBytes: number
  archived: boolean
}

type CompanyEmailAttachmentCreateAttributes = {
  companyEmailId: string
  filename: string
  s3Key: string
  sizeBytes: number
  archived?: boolean
}

@MutableTable({ tableName: DoeModels.COMPANY_EMAIL_ATTACHMENT })
export class CompanyEmailAttachmentModel extends MutableModel<
  CompanyEmailAttachmentAttributes,
  CompanyEmailAttachmentCreateAttributes
> {
  @ForeignKey(() => CompanyEmailModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_email_id' })
  companyEmailId!: string

  /**
   * The name the recipient sees, as the admin uploaded it — not the S3 key,
   * which is a UUID. Same reasoning as `ReportMailAttachment.label`: a reader
   * with two attachments has to be able to tell which is which.
   */
  @Column({ type: DataType.TEXT, allowNull: false })
  filename!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 's3_key' })
  s3Key!: string

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'size_bytes' })
  sizeBytes!: number

  /**
   * False while `s3Key` still points at the transient staging prefix, true once
   * the file has been moved to the company-files bucket.
   *
   * ⚠️ A permanently false row is a real state, not a bug: when
   * `AWS_DOE_COMPANY_FILES_BUCKET` is unset — as it is until that bucket is
   * provisioned — the move is skipped and the staged object is deliberately
   * *kept*, so that the one durable copy is never discarded. See
   * `CompanyEmailService.archiveAttachments`.
   */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  archived!: boolean

  @BelongsTo(() => CompanyEmailModel, {
    foreignKey: 'companyEmailId',
    as: 'companyEmail',
  })
  companyEmail?: CompanyEmailModel
}
