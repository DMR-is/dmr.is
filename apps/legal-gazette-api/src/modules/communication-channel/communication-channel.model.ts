import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'

type CommunicationChannelAttributes = {
  email: string
  name: string | null
  phone: string | null
}

export type CommunicationChannelCreateAttributes = {
  email: string
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
}
