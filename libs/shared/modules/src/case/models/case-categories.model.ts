import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertCategoryModel } from '../../journal/models/advert-category.model'
import { CaseModel } from './case.model'

@Table({ tableName: 'case_categories', timestamps: false })
export class CaseCategoriesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertCategoryModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'category_id',
  })
  categoryId!: string

  @BelongsTo(() => CaseModel)
  case?: CaseModel

  @BelongsTo(() => AdvertCategoryModel)
  category?: AdvertCategoryModel
}
