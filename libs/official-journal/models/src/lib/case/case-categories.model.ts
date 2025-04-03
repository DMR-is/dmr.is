import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from './case.model'
import { OfficialJournalModels } from '../constants'
import { AdvertCategoryModel } from '../journal/advert-category.model'

@Table({ tableName: OfficialJournalModels.CASE_CATEGORIES, timestamps: false })
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
