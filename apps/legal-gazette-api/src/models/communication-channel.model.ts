import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import {
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertModel } from './advert.model'

type CommunicationChannelAttributes = {
  advertId: string
  email: string
  name?: string | null
  phone?: string | null
}

export type CommunicationChannelCreateAttributes = {
  email: string
  advertId?: string
  name?: string | null
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.COMMUNICATION_CHANNEL })
@DefaultScope(() => ({
  attributes: ['id', 'advertId', 'email', 'name', 'phone'],
  order: [['name', 'ASC']],
}))
export class CommunicationChannelModel extends BaseModel<
  CommunicationChannelAttributes,
  CommunicationChannelCreateAttributes
> {
  @ForeignKey(() => AdvertModel)
  @Column({ type: DataType.UUID, allowNull: false })
  advertId!: string

  @Column({
    type: DataType.TEXT,
  })
  email!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  phone?: string | null

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  static fromModel(model: CommunicationChannelModel): CommunicationChannelDto {
    return {
      id: model.id,
      advertId: model.advertId,
      email: model.email,
      name: model.name ?? undefined,
      phone: model.phone ?? undefined,
    }
  }

  fromModel(): CommunicationChannelDto {
    return CommunicationChannelModel.fromModel(this)
  }
}

export class CommunicationChannelDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  advertId!: string

  @ApiString()
  email!: string

  @ApiOptionalString({ nullable: true })
  name?: string | null

  @ApiOptionalString({ nullable: true })
  phone?: string | null
}
