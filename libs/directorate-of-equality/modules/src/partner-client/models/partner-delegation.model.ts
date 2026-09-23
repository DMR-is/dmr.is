import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { DoeModels } from '../../constants'
import { UserModel } from '../../user/models/user.model'
import { PartnerClientModel } from './partner-client.model'

type PartnerDelegationAttributes = {
  partnerClientId: string
  companyId: string
  companyNationalId: string
  scopes: ApiKeyScopeEnum[]
  grantedByNationalId: string
  revokedAt: Date | null
  revokedByUserId: string | null
  revokedByNationalId: string | null
}

type PartnerDelegationCreateAttributes = {
  partnerClientId: string
  companyId: string
  companyNationalId: string
  scopes: ApiKeyScopeEnum[]
  grantedByNationalId: string
}

/**
 * A company allowing a `PartnerClientModel` to act for it. Granted by the
 * company itself on the self-service web, behind island.is login, so it records
 * a witnessed act rather than the firm's claim that the employer consented.
 *
 * Lasts until the company turns it off; there is no expiry. Turning it back on
 * is a new row, so an earlier grant stays as audit of who allowed it and when
 * (`created_at` is the grant time). At most one live row per firm and company.
 *
 * `company_national_id` is denormalised from `company` so the partner API
 * resolves the delegation from the request's `X-Company-National-Id` header in
 * one indexed read. Safe to copy because a kennitala *is* the company's
 * identity and does not change.
 */
@MutableTable({ tableName: DoeModels.PARTNER_DELEGATION })
export class PartnerDelegationModel extends MutableModel<
  PartnerDelegationAttributes,
  PartnerDelegationCreateAttributes
> {
  @ForeignKey(() => PartnerClientModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'partner_client_id' })
  partnerClientId!: string

  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'company_national_id',
  })
  companyNationalId!: string

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: false })
  scopes!: ApiKeyScopeEnum[]

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'granted_by_national_id',
  })
  grantedByNationalId!: string

  @Column({ type: DataType.DATE, allowNull: true, field: 'revoked_at' })
  revokedAt!: Date | null

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'revoked_by_user_id' })
  revokedByUserId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'revoked_by_national_id',
  })
  revokedByNationalId!: string | null
}
