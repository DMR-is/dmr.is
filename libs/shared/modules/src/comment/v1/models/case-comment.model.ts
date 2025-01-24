import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'
import { CaseCommentSourceEnum } from '@dmr.is/shared/dto'

import { CaseModel, CaseStatusModel } from '../../../case/models'
import { CaseCommentTypeModel } from './case-comment-type.model'

@Table({ tableName: 'case_comment', timestamps: false })
export class CaseCommentModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'created_at',
  })
  created!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  internal!: boolean

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'application_state',
  })
  applicationState!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'source',
  })
  source!: CaseCommentSourceEnum

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'creator',
  })
  creator!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'receiver',
  })
  receiver!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  comment!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'type_id',
  })
  @ForeignKey(() => CaseCommentTypeModel)
  typeId!: string

  @BelongsTo(() => CaseCommentTypeModel, 'type_id')
  type!: CaseCommentTypeModel

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_status_id',
  })
  @ForeignKey(() => CaseStatusModel)
  caseStatusId!: string

  @BelongsTo(() => CaseStatusModel, 'case_status_id')
  caseStatus!: CaseStatusModel

  @BelongsTo(() => CaseModel, 'caseId')
  case!: CaseModel
}
