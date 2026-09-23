import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'
import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { UserModel } from '../../user/models/user.model'
import type { PartnerClientDto } from '../dto/partner-client.dto'

type PartnerClientAttributes = {
  nationalId: string
  name: string
  scopes: ApiKeyScopeEnum[]
  createdByUserId: string
  revokedAt: Date | null
  revokedByUserId: string | null
  revokedReason: string | null
}

type PartnerClientCreateAttributes = {
  nationalId: string
  name: string
  scopes: ApiKeyScopeEnum[]
  createdByUserId: string
}

/**
 * An intermediary approved to file on behalf of the companies that delegate to
 * it — an accounting firm with a book of employers, as opposed to an employer
 * integrating its own payroll system with a `doe_api_key`.
 *
 * Created by a DoE admin only: approving a firm is a commercial decision by
 * Jafnréttisstofa. The firm proves itself with a `PartnerClientKeyModel`, and
 * may act for a company only while a live `PartnerDelegationModel` names both.
 *
 * Revoking a client stamps only this row. Its keys and delegations keep their
 * own `revoked_at`, so a key or a delegation is live only while its own
 * `revoked_at` AND this row's are both null — every reader checks both.
 *
 * `scopes` is the ceiling. What a request may do is this intersected with the
 * delegation's scopes, so one employer can withhold `scoring:write` from a firm
 * another employer grants it to.
 */
@MutableTable({ tableName: DoeModels.PARTNER_CLIENT })
export class PartnerClientModel extends MutableModel<
  PartnerClientAttributes,
  PartnerClientCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: false })
  scopes!: ApiKeyScopeEnum[]

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'created_by_user_id',
  })
  createdByUserId!: string

  @Column({ type: DataType.DATE, allowNull: true, field: 'revoked_at' })
  revokedAt!: Date | null

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'revoked_by_user_id' })
  revokedByUserId!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'revoked_reason' })
  revokedReason!: string | null

  static fromModel(model: PartnerClientModel): PartnerClientDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      name: model.name,
      scopes: model.scopes,
      createdByUserId: model.createdByUserId,
      createdAt: model.createdAt,
      revokedAt: model.revokedAt,
      revokedByUserId: model.revokedByUserId,
      revokedReason: model.revokedReason,
    }
  }

  fromModel(): PartnerClientDto {
    return PartnerClientModel.fromModel(this)
  }
}
