// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseStatusEnum } from '@dmr.is/shared-dto'

import type { CaseCommentModel as CaseCommentModelRef } from '../../comment/v1/models'
import { CaseCommentModel } from '../../comment/v1/models'
import { CaseModel } from './case.model'

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
  comment?: CaseCommentModelRef

  @HasMany(() => CaseModel, 'statusId')
  cases?: CaseModel[]
}
