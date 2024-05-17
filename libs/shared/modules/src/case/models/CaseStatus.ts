import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseCommentDto } from '../../comment/models'

@Table({ tableName: 'case_status', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseStatusDto extends Model {
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
  key!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  value!: string

  @BelongsTo(() => CaseCommentDto, 'id')
  comment?: CaseCommentDto
}
