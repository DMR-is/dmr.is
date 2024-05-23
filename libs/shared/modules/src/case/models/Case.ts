import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseCommentDto, CaseCommentsDto } from '../../comment/models'
import { AdvertDepartmentDTO } from '../../journal/models'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

@Table({ tableName: 'case_case', timestamps: false })
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
    field: 'application_id',
  })
  applicationId!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'case_number',
  })
  caseNumber!: number

  @Column({ type: DataType.UUID, field: 'status_id' })
  statusId!: string

  @BelongsTo(() => CaseStatusDto, 'status_id')
  status!: CaseStatusDto

  @Column({ type: DataType.UUID, field: 'tag_id' })
  tagId!: string

  @BelongsTo(() => CaseTagDto, 'tag_id')
  tag!: CaseTagDto | null

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
    field: 'is_legacy',
  })
  isLegacy!: boolean

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'assigned_user_id',
  })
  assignedUserId!: string | null

  @Column({ type: DataType.UUID, field: 'case_communication_status_id' })
  communicationStatusId!: string

  @BelongsTo(() => CaseCommunicationStatusDto, 'case_communication_status_id')
  communicationStatus!: CaseCommunicationStatusDto

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'published_at',
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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'fast_track',
  })
  fastTrack!: boolean

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_title',
  })
  advertTitle!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_requested_publication_date',
  })
  requestedPublicationDate!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'department_id',
  })
  departmentId!: string | null

  @BelongsTo(() => AdvertDepartmentDTO, 'department_id')
  department!: AdvertDepartmentDTO

  @BelongsToMany(() => CaseCommentDto, {
    through: { model: () => CaseCommentsDto },
  })
  comments!: CaseCommentDto[]
}
