import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript'

import { CaseDto } from './Case'
import { CaseCommentTaskDto } from './CaseCommentTask'
import { CaseCommentTypeDto } from './CaseCommentType'
import { CaseStatusDto } from './CaseStatus'

@Table({ tableName: 'case_comment', timestamps: true })
export class CaseCommentDto extends Model {
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
    type: DataType.UUID,
    allowNull: false,
    field: 'type_id',
  })
  typeId!: string

  @BelongsTo(() => CaseCommentTypeDto, 'type_id')
  type!: CaseCommentTypeDto

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'status_id',
  })
  caseStatusId!: string

  @BelongsTo(() => CaseStatusDto, 'status_id')
  caseStatus!: CaseStatusDto

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'task_id',
  })
  taskId!: string

  @BelongsTo(() => CaseCommentTaskDto, 'task_id')
  task!: CaseCommentTaskDto

  @BelongsTo(() => CaseDto, 'case_id')
  case!: CaseDto
}
