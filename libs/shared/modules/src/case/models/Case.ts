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

@Table({ tableName: 'advert', timestamps: false })
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
  applicationId!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  caseNumber!: number

  @BelongsTo(() => CaseStatusDto)
  status!: CaseStatusDto

  @BelongsTo(() => CaseTagDto)
  tag!: CaseTagDto | null

  // TODO: Add application history

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  override createdAt!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  override updatedAt!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isLegacy!: boolean

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assignedTo!: string | null

  @BelongsTo(() => CaseCommunicationStatusDto)
  communicationStatus!: CaseCommunicationStatusDto

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
