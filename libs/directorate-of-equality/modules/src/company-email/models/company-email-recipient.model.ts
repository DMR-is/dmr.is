import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { DoeModels } from '../../constants'
import { CompanyEmailRecipientStatusEnum } from './company-email.enums'
import { CompanyEmailModel } from './company-email.model'

/**
 * One company's place in a batch, resolved **before** the first message goes
 * out and updated as the send walks the list.
 *
 * ⚠️ Resolving up front rather than iterating a live query is the load-bearing
 * decision here, and it buys three things:
 *
 *   1. The preview is honest. What step 2 of the modal lists is literally the
 *      rows the job will walk, so a company edited mid-send cannot silently join
 *      or leave the batch after the admin approved a count.
 *   2. The batch is resumable. A container that dies mid-send leaves PENDING
 *      rows, which is a precise statement of what still has to go out — where a
 *      live query would have to guess.
 *   3. It cannot double-send. Re-walking a filter would re-include companies
 *      already mailed.
 *
 * `companyName` and `email` are **snapshots**, not projections of the company
 * row. An admin who corrects a company's address a week later must not thereby
 * rewrite the record of where last week's mail actually went.
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
   * Null when no address could be resolved for the company — either because it
   * has none on file, or because it was skipped for quarantine and happens to
   * have none either. `status` is what says which, not this.
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
