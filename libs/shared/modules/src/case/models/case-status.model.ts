import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'
import { CaseStatusEnum } from '@dmr.is/shared/dto'

import { CaseCommentModel } from '../../comment/models'

@Table({ tableName: 'case_status', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseStatusModel extends Model {
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
  title!: CaseStatusEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string

  @BelongsTo(() => CaseCommentModel, 'id')
  comment?: CaseCommentModel
}
