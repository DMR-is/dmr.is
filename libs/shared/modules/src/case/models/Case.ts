import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseCommentDto } from './CaseComment'
import { CaseCommentsDto } from './CaseComments'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

@Table({ tableName: 'case_case', timestamps: true })
export class CaseDto extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  application_id!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  case_number!: number

  @Column({ type: DataType.UUID, field: 'status_id' })
  statusId!: string

  @BelongsTo(() => CaseStatusDto, 'status_id')
  status!: CaseStatusDto

  @Column({ type: DataType.UUID, field: 'tag_id' })
  tagId!: string

  @BelongsTo(() => CaseTagDto, 'tag_id')
  tag!: CaseTagDto | null

  // TODO: Add application history

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'created_at',
  })
  override createdAt!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'updated_at',
  })
  override updatedAt!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_legacy!: boolean

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assigned_user_id!: string | null

  @Column({ type: DataType.UUID, field: 'case_communication_status_id' })
  caseCommunicationStatusId!: string

  @BelongsTo(() => CaseCommunicationStatusDto, 'case_communication_status_id')
  caseCommunicationStatus!: CaseCommunicationStatusDto

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  publishedAt!: string | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  price!: number | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  paid!: boolean | null

  @BelongsToMany(() => CaseCommentDto, {
    through: { model: () => CaseCommentsDto },
  })
  comments!: CaseCommentDto[]
}
