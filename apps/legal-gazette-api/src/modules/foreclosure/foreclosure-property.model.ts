import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { ForeclosureModel } from './foreclosure.model'

@BaseTable({ tableName: LegalGazetteModels.FORECLOSURE_PROPERTY })
@DefaultScope(() => ({
  include: [],
  orderBy: [['propertyName', 'ASC']],
}))
export class ForeclosurePropertyModel extends BaseModel<{}, {}> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => ForeclosureModel)
  foreclosureId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  propertyName!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  propertyAddress!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  propertyNumber!: string

  @Column({ type: DataType.INTEGER, allowNull: false })
  propertyTotalPrice!: number

  @BelongsTo(() => ForeclosureModel)
  foreclosure!: ForeclosureModel
}
