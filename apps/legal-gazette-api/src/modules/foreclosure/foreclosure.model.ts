import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { ForeclosurePropertyModel } from './foreclosure-property.model'

@BaseTable({ tableName: LegalGazetteModels.FORECLOSURE })
export class ForeclosureModel extends BaseModel<{}, {}> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureRegion!: string

  @Column({ type: DataType.STRING, allowNull: false })
  foreclosureAddress!: string

  @Column({ type: DataType.DATE, allowNull: false })
  foreclosureDate!: Date

  @Column({ type: DataType.STRING, allowNull: false })
  authorityLocation!: string

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @HasMany(() => ForeclosurePropertyModel)
  properties!: ForeclosurePropertyModel[]
}
