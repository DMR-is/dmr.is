import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { UserModel } from '../../user/models/user.model'
import type { CompanyCommentDto } from '../dto/company-comment.dto'
import { CompanyModel } from './company.model'

/**
 * Internal, admin-authored note attached to a company. Unlike report comments
 * there is no visibility dimension — company comments are reviewer-internal
 * only (companies never see them), so there is no author-kind/visibility
 * column. Paranoid: deletes are soft so the timeline stays auditable.
 */
type CompanyCommentAttributes = {
  companyId: string
  authorUserId: string | null
  body: string
}

type CompanyCommentCreateAttributes = {
  companyId: string
  authorUserId?: string | null
  body: string
}

@ParanoidTable({ tableName: DoeModels.COMPANY_COMMENT })
export class CompanyCommentModel extends ParanoidModel<
  CompanyCommentAttributes,
  CompanyCommentCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'author_user_id' })
  authorUserId!: string | null

  @Column({ type: DataType.TEXT, allowNull: false })
  body!: string

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel

  @BelongsTo(() => UserModel, { foreignKey: 'authorUserId', as: 'author' })
  author?: UserModel | null

  static fromModel(model: CompanyCommentModel): CompanyCommentDto {
    return {
      id: model.id,
      companyId: model.companyId,
      authorUserId: model.authorUserId,
      body: model.body,
      createdAt: model.createdAt,
    }
  }

  fromModel(): CompanyCommentDto {
    return CompanyCommentModel.fromModel(this)
  }
}
