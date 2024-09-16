import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseModel, CaseStatusModel } from '../../case/models'
import { CaseCommentTaskModel } from './case-comment-task.model'
import { CaseCommentTypeModel } from './case-comment-type.model'
import { CaseCommentsModel } from './case-comments.model'

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
    type: DataType.STRING,
    allowNull: false,
    field: 'created_at',
  })
  override createdAt!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  internal!: boolean

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  state!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'type_id',
  })
  typeId!: string

  @BelongsTo(() => CaseCommentTypeModel, 'type_id')
  type!: CaseCommentTypeModel

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'status_id',
  })
  statusId!: string

  @BelongsTo(() => CaseStatusModel, 'status_id')
  status!: CaseStatusModel

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'task_id',
  })
  taskId!: string

  @BelongsTo(() => CaseCommentTaskModel, 'task_id')
  task!: CaseCommentTaskModel

  @BelongsToMany(() => CaseModel, {
    through: () => CaseCommentsModel,
  })
  cases!: CaseModel[]
}
