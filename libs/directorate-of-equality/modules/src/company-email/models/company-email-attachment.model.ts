import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { CompanyEmailModel } from './company-email.model'

/**
 * One file attached to a batch — one row per file, not per recipient.
 *
 * That is why this is not filed through `ICompanyFileService`, which keys
 * documents under the owning company: right for an approval, but a
 * 1700-recipient send would write 1700 copies of the same file. Each company
 * reaches the attachment through its timeline event → batch → attachment.
 *
 * `s3Key` moves once, from the staging prefix to the durable company-files one;
 * `archived` says which.
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
   * which is a UUID. Same reasoning as `ReportMailAttachment.label`.
   */
  @Column({ type: DataType.TEXT, allowNull: false })
  filename!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 's3_key' })
  s3Key!: string

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'size_bytes' })
  sizeBytes!: number

  /**
   * False while `s3Key` still points at the staging prefix, true once the file
   * has been moved to the company-files bucket.
   *
   * A permanently false row is a real state: with `AWS_DOE_COMPANY_FILES_BUCKET`
   * unset the move is skipped and the staged object deliberately kept, so the
   * one durable copy is never discarded.
   */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  archived!: boolean

  @BelongsTo(() => CompanyEmailModel, {
    foreignKey: 'companyEmailId',
    as: 'companyEmail',
  })
  companyEmail?: CompanyEmailModel
}
