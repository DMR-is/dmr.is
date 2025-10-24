import {
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { CommunicationChannelDto } from './dto/communication-channel.dto'

type CommunicationChannelAttributes = {
  advertId: string
  email: string
  name: string | null
  phone: string | null
}

export type CommunicationChannelCreateAttributes = {
  email: string
  advertId?: string
  name?: string | null
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.COMMUNICATION_CHANNEL })
@DefaultScope(() => ({
  attributes: ['id', 'email', 'name', 'phone'],
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
  name!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  phone!: string | null

  static fromModel(model: CommunicationChannelModel): CommunicationChannelDto {
    return {
      email: model.email,
      name: model.name ?? undefined,
      phone: model.phone ?? undefined,
    }
  }

  fromModel(): CommunicationChannelDto {
    return CommunicationChannelModel.fromModel(this)
  }
}
