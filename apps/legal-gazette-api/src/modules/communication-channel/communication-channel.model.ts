import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseModel } from '../cases/cases.model'

type CommunicationChannelAttributes = {
  caseId: string
  email: string
  name: string | null
  phone: string | null
}

type CommunicationChannelCreateAttributes = {
  email: string
  caseId: string
  name?: string | null
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.COMMUNICATION_CHANNEL })
@DefaultScope(() => ({
  attributes: ['email', 'name', 'phone'],
  order: [['createdAt', 'ASC']],
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

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModel
}
