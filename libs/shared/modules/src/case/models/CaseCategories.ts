import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertCategoryDTO } from '../../journal/models/AdvertCategory'
import { CaseDto } from './Case'

@Table({ tableName: 'case_categories', timestamps: false })
export class CaseCategoriesDto extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertCategoryDTO)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'category_id',
  })
  categoryId!: string

  @BelongsTo(() => CaseDto)
  case?: CaseDto

  @BelongsTo(() => AdvertCategoryDTO)
  category?: AdvertCategoryDTO
}
