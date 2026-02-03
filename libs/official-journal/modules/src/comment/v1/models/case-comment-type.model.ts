import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseCommentTypeTitleEnum } from '@dmr.is/shared/dto'

@Table({ tableName: 'case_comment_type', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseCommentTypeModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: CaseCommentTypeTitleEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
