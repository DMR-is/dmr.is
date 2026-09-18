import { Column, DataType } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import {
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  DOE_API_KEY_TABLE,
} from '../api-key.constants'
import type { ApiKeyDto } from '../dto/api-key.dto'

type ApiKeyAttributes = {
  companyId: string
  companyNationalId: string
  keyId: string
  secretHash: string
  label: string | null
  scopes: ApiKeyScopeEnum[]
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

type ApiKeyCreateAttributes = {
  companyId: string
  companyNationalId: string
  keyId: string
  secretHash: string
  scopes: ApiKeyScopeEnum[]
  createdVia: ApiKeyOriginEnum
  label?: string | null
  createdByUserId?: string | null
  createdByNationalId?: string | null
  expiresAt?: Date | null
}

/**
 * A machine credential belonging to exactly one company.
 *
 * One-to-many with `company`, the foreign key on this row — a join table would
 * permit one key to authenticate as several companies, which is the specific
 * property to avoid. Several live keys per company are expected and supported,
 * because rotating without downtime means issuing the replacement before
 * revoking the incumbent.
 *
 * Declares no Sequelize associations on purpose. `directorate-of-equality-api`
 * has the whole model graph, but the partner API registers this model alone —
 * a `belongsTo` here would drag `CompanyModel` and everything it reaches into a
 * service that only needs to check a credential. The `company_id` and
 * `created_by_user_id` foreign keys still exist and are still enforced in the
 * database; an FK constraint does not require an association to be declared.
 *
 * `company_national_id` is denormalised from `company` for the same reason: it
 * lets the partner API resolve the authenticated tenant from a single indexed
 * read on this table. Safe to copy because a kennitala *is* the company's
 * identity — it does not change, so the two columns cannot drift apart.
 */
@MutableTable({ tableName: DOE_API_KEY_TABLE })
export class ApiKeyModel extends MutableModel<
  ApiKeyAttributes,
  ApiKeyCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'company_national_id',
  })
  companyNationalId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'key_id' })
  keyId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'secret_hash' })
  secretHash!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  label!: string | null

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: false,
  })
  scopes!: ApiKeyScopeEnum[]

  @Column({
    type: DataType.ENUM(...Object.values(ApiKeyOriginEnum)),
    allowNull: false,
    field: 'created_via',
  })
  createdVia!: ApiKeyOriginEnum

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

  static fromModel(model: ApiKeyModel): ApiKeyDto {
    return {
      id: model.id,
      companyId: model.companyId,
      keyId: model.keyId,
      label: model.label,
      scopes: model.scopes,
      createdVia: model.createdVia,
      createdByNationalId: model.createdByNationalId,
      createdByUserId: model.createdByUserId,
      createdAt: model.createdAt,
      expiresAt: model.expiresAt,
      lastUsedAt: model.lastUsedAt,
      revokedAt: model.revokedAt,
      revokedByNationalId: model.revokedByNationalId,
      revokedByUserId: model.revokedByUserId,
      revokedReason: model.revokedReason,
    }
  }

  fromModel(): ApiKeyDto {
    return ApiKeyModel.fromModel(this)
  }
}
