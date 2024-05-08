import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseDto } from './Case'
import { CaseCommentsDto } from './CaseComments'
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
  })
  override createdAt!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  internal!: boolean

  @BelongsTo(() => CaseCommentTypeDto)
  type!: CaseCommentTypeDto

  @BelongsTo(() => CaseStatusDto)
  caseStatus!: CaseStatusDto

  @BelongsTo(() => CaseCommentTaskDto)
  task!: CaseCommentTaskDto

  @BelongsToMany(() => CaseDto, {
    through: () => CaseCommentsDto,
  })
  cases!: CaseDto[]
}
