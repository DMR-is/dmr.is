import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
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
  isSystem: boolean
}

/**
 * `isSystem` is deliberately absent, even though the column exists and is
 * readable above.
 *
 * The only writer of a system comment is the company-register load
 * (`scripts/company-register-to-sql.ts`), which is raw SQL and never touches
 * this model. That load also owns `is_system` as its re-run marker: it clears
 * its previous notes with an unscoped `DELETE FROM company_comment WHERE
 * is_system = true`. So the first feature to set the flag through `create()`
 * would have its rows silently deleted by the next register re-run. Leaving the
 * attribute off makes that unreachable rather than merely documented.
 *
 * Whoever needs it next should give the load a marker of its own — a provenance
 * column, or a distinct author kind — and narrow that DELETE onto it, then add
 * `isSystem` back here. See
 * `m-20260901-company-comment-system-author.js`.
 */
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

  /**
   * True when the system wrote this comment rather than a person — today only
   * the notes the company-register load seeds from the retired SharePoint
   * register (see `LegacyReportModel`).
   *
   * ⚠️ Not the same as `authorUserId === null`. A null author means "no user is
   * attached", which the timeline renders as "Starfsmaður" — an unnamed member
   * of staff. This flag is what lets the UI say "Kerfið" instead, and keeps a
   * future author-less admin comment from being relabelled as system-written.
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system',
  })
  isSystem!: boolean

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel

  @BelongsTo(() => UserModel, { foreignKey: 'authorUserId', as: 'author' })
  author?: UserModel | null

  static fromModel(model: CompanyCommentModel): CompanyCommentDto {
    return {
      id: model.id,
      companyId: model.companyId,
      authorUserId: model.authorUserId,
      authorName: model.author
        ? `${model.author.firstName} ${model.author.lastName}`
        : null,
      body: model.body,
      isSystem: model.isSystem,
      createdAt: model.createdAt,
    }
  }

  fromModel(): CompanyCommentDto {
    return CompanyCommentModel.fromModel(this)
  }
}
