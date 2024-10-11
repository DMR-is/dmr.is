import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertModel } from '../../journal/models'
import { CaseModel } from './case.model'

@Table({ tableName: 'published_case_adverts', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CasePublishedAdvertsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'advert_id',
  })
  advertId!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel
}
