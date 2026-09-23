import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'
import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { UserModel } from '../../user/models/user.model'
import { PartnerClientModel } from './partner-client.model'

type PartnerClientKeyAttributes = {
  partnerClientId: string
  keyId: string
  secretHash: string
  label: string | null
  createdVia: ApiKeyOriginEnum
  createdByUserId: string | null
  createdByNationalId: string | null
  expiresAt: Date | null
  lastUsedAt: Date | null
  revokedAt: Date | null
  revokedByUserId: string | null
  revokedByNationalId: string | null
  revokedReason: string | null
}

type PartnerClientKeyCreateAttributes = {
  partnerClientId: string
  keyId: string
  secretHash: string
  createdVia: ApiKeyOriginEnum
  label?: string | null
  createdByUserId?: string | null
  createdByNationalId?: string | null
  expiresAt?: Date | null
}

/**
 * A credential belonging to a `PartnerClientModel`. The vendor-side twin of
 * `ApiKeyModel`: the same hashing, the same revocation and expiry columns, the
 * same actor rules — so one verify path serves both.
 *
 * Several live keys per client, because rotating without downtime means issuing
 * the replacement before revoking the incumbent. It carries no scopes of its
 * own: the key *is* the client, and the client's scopes are the ones that count.
 *
 * Revoking a key leaves the client and its delegations alone; revoking the
 * client is what cuts the firm off.
 */
@MutableTable({ tableName: DoeModels.PARTNER_CLIENT_KEY })
export class PartnerClientKeyModel extends MutableModel<
  PartnerClientKeyAttributes,
  PartnerClientKeyCreateAttributes
> {
  @ForeignKey(() => PartnerClientModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'partner_client_id' })
  partnerClientId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'key_id' })
  keyId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'secret_hash' })
  secretHash!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  label!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApiKeyOriginEnum)),
    allowNull: false,
    field: 'created_via',
  })
  createdVia!: ApiKeyOriginEnum

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'created_by_user_id' })
  createdByUserId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'created_by_national_id',
  })
  createdByNationalId!: string | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'expires_at' })
  expiresAt!: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_used_at' })
  lastUsedAt!: Date | null

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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'revoked_reason' })
  revokedReason!: string | null
}
