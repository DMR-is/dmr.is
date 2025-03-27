import {
  Column,
  DataType,
  DefaultScope,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'
import { CaseStatusEnum } from '@dmr.is/shared/dto'

import { CaseModel } from './case.model'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.CASE_STATUS, timestamps: false })
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

  @HasMany(() => CaseModel, 'statusId')
  cases?: CaseModel[]
}
