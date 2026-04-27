import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportCommentDto } from '../../report-comment/dto/report-comment.dto'
import { UserModel } from '../../user/models/user.model'
import { ReportStatusEnum } from './report.enums'
import { ReportModel } from './report.model'

export enum CommentAuthorKindEnum {
  REVIEWER = 'REVIEWER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
}

export enum CommentVisibilityEnum {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

type ReportCommentAttributes = {
  reportId: string
  authorKind: CommentAuthorKindEnum
  authorUserId: string | null
  visibility: CommentVisibilityEnum
  body: string
  reportStatus: ReportStatusEnum
}

type ReportCommentCreateAttributes = {
  reportId: string
  authorKind: CommentAuthorKindEnum
  authorUserId?: string | null
  visibility: CommentVisibilityEnum
  body: string
  reportStatus: ReportStatusEnum
}

@ParanoidTable({ tableName: DoeModels.REPORT_COMMENT })
export class ReportCommentModel extends ParanoidModel<
  ReportCommentAttributes,
  ReportCommentCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @Column({
    type: DataType.ENUM(...Object.values(CommentAuthorKindEnum)),
    allowNull: false,
    field: 'author_kind',
  })
  authorKind!: CommentAuthorKindEnum

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'author_user_id' })
  authorUserId!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(CommentVisibilityEnum)),
    allowNull: false,
  })
  visibility!: CommentVisibilityEnum

  @Column({ type: DataType.TEXT, allowNull: false })
  body!: string

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatusEnum)),
    allowNull: false,
    field: 'report_status',
  })
  reportStatus!: ReportStatusEnum

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  @BelongsTo(() => UserModel, { foreignKey: 'authorUserId', as: 'author' })
  author?: UserModel | null

  static fromModel(model: ReportCommentModel): ReportCommentDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      reportId: model.reportId,
      authorKind: model.authorKind,
      authorUserId: model.authorUserId,
      visibility: model.visibility,
      body: model.body,
      reportStatus: model.reportStatus,
    }
  }

  fromModel(): ReportCommentDto {
    return ReportCommentModel.fromModel(this)
  }
}
