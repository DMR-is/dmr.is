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

import { CaseModel } from './case.model'
import { CaseAdditionModel } from './case-addition.model'

@Table({
  tableName: 'case_additions',
  timestamps: false,
})
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseAdditionsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => CaseAdditionModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'addition_id',
  })
  additionId!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'order',
  })
  order!: number

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => CaseAdditionModel)
  caseAddition!: CaseAdditionModel
}
