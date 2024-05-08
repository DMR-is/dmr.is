import { Model } from 'sequelize'
import {
  BelongsTo,
  Column,
  DataType,
  HasOne,
  Table,
} from 'sequelize-typescript'

import { AdvertStatusDTO } from '../../journal/models'
import { CaseCommentTitleDto } from './CaseCommentTitle'

@Table({ tableName: 'case_comment_task', timestamps: true })
export class CaseCommentTaskDto extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  from!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  to!: string | null

  // @BelongsTo(() => AdvertStatusDTO)
  // title!: CaseCommentTitleDto

  // @BelongsTo(() => CaseCommentTitleDto)
  // title!: CaseCommentTitleDto
}
