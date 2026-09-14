import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { DoeModels } from '../../constants'
import { CompanyEmailRecipientStatusEnum } from './company-email.enums'
import { CompanyEmailModel } from './company-email.model'

/**
 * One company's place in a batch, resolved before the first message goes out and
 * updated as the send walks the list.
 *
 * Resolving up front rather than iterating a live query is what makes the
 * preview honest (the modal lists the rows the job will walk), the batch
 * resumable (PENDING rows state exactly what is left) and double-sending
 * impossible.
 *
 * `companyName` and `email` are snapshots, not projections of the company row:
 * correcting an address next week must not rewrite where last week's mail went.
 *
 * One row per address, which is usually but not always one row per company — a
 * single-company send may name several, and each is its own message, so no
 * recipient learns who else was written to. Hence the resume uniqueness is on
 * (batch, company, email).
 */
type CompanyEmailRecipientAttributes = {
  companyEmailId: string
  companyId: string
  companyName: string
  email: string | null
  status: CompanyEmailRecipientStatusEnum
  error: string | null
  sentAt: Date | null
}

type CompanyEmailRecipientCreateAttributes = {
  companyEmailId: string
  companyId: string
  companyName: string
  email?: string | null
  status: CompanyEmailRecipientStatusEnum
  error?: string | null
  sentAt?: Date | null
}

@MutableTable({ tableName: DoeModels.COMPANY_EMAIL_RECIPIENT })
export class CompanyEmailRecipientModel extends MutableModel<
  CompanyEmailRecipientAttributes,
  CompanyEmailRecipientCreateAttributes
> {
  @ForeignKey(() => CompanyEmailModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_email_id' })
  companyEmailId!: string

  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'company_name' })
  companyName!: string

  /**
   * Null when no address could be resolved — no address on file, or skipped for
   * quarantine and none on file either. `status` is what says which.
   */
  @Column({ type: DataType.TEXT, allowNull: true })
  email!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(CompanyEmailRecipientStatusEnum)),
    allowNull: false,
  })
  status!: CompanyEmailRecipientStatusEnum

  /** The SES failure, verbatim, for a FAILED row. Null on every other status. */
  @Column({ type: DataType.TEXT, allowNull: true })
  error!: string | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'sent_at' })
  sentAt!: Date | null

  @BelongsTo(() => CompanyEmailModel, {
    foreignKey: 'companyEmailId',
    as: 'companyEmail',
  })
  companyEmail?: CompanyEmailModel

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel
}
