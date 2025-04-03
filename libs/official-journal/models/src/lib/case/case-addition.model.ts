import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'
import { OfficialJournalModels } from '../constants'

export enum AdditionTypeEnum {
  Html = 'html',
  File = 'file',
}

@Table({ tableName: OfficialJournalModels.CASE_ADDITION, timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseAdditionModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'title',
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'content',
  })
  content!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'type',
  })
  type!: AdditionTypeEnum
}
