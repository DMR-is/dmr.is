// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdditionalPartiesModel } from '../../additional-parties/models/additional-parties.model'
import type { AdvertTypeModel as AdvertTypeModelRef } from '../../advert-type/models'
import { AdvertTypeModel } from '../../advert-type/models'
import {
  ApplicationAttachmentModel,
  CaseAttachmentsModel,
} from '../../attachments/models'
import { CommentModel } from '../../comment/v2/models/comment.model'
import type {
  AdvertDepartmentModel as AdvertDepartmentModelRef,
  AdvertInvolvedPartyModel as AdvertInvolvedPartyModelRef,
  AdvertModel as AdvertModelRef,
} from '../../journal/models'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
} from '../../journal/models'
import type { SignatureModel as SignatureModelRef } from '../../signature/models/signature.model'
import { SignatureModel } from '../../signature/models/signature.model'
import type { UserModel as UserModelRef } from '../../user/models/user.model'
import { UserModel } from '../../user/models/user.model'
import { CaseAdditionModel } from './case-addition.model'
import { CaseAdditionsModel } from './case-additions.model'
import { CaseCategoriesModel } from './case-categories.model'
import { CaseChannelModel } from './case-channel.model'
import { CaseChannelsModel } from './case-channels.model'
import type { CaseCommunicationStatusModel as CaseCommunicationStatusModelRef } from './case-communication-status.model'
import { CaseCommunicationStatusModel } from './case-communication-status.model'
import { CaseHistoryModel } from './case-history.model'
import type { CaseStatusModel as CaseStatusModelRef } from './case-status.model'
import { CaseStatusModel } from './case-status.model'
import { CaseTagModel } from './case-tag.model'
import type { CaseTransactionModel as CaseTransactionModelRef } from './case-transaction.model'
import { CaseTransactionModel } from './case-transaction.model'

@Table({ tableName: 'case_case', timestamps: false })
export class CaseModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'application_id',
  })
  applicationId?: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year!: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_number',
  })
  caseNumber!: string

  @Column({ type: DataType.UUID, field: 'status_id' })
  statusId!: string

  @BelongsTo(() => CaseStatusModel, 'status_id')
  status!: CaseStatusModelRef

  @Column({ type: DataType.UUID, field: 'tag_id' })
  tagId!: string

  @BelongsTo(() => CaseTagModel, 'tag_id')
  tag!: CaseTagModel | null

  @Column({
    type: DataType.UUID,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @BelongsTo(() => AdvertInvolvedPartyModel, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyModelRef

  @HasMany(() => AdditionalPartiesModel, 'case_id')
  additionalParties?: AdditionalPartiesModel[]

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

  @BelongsTo(() => UserModel, 'assigned_user_id')
  assignedUser?: UserModelRef

  @Column({ type: DataType.UUID, field: 'case_communication_status_id' })
  communicationStatusId!: string

  @BelongsTo(() => CaseCommunicationStatusModel, 'case_communication_status_id')
  communicationStatus!: CaseCommunicationStatusModelRef

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'published_at',
  })
  publishedAt!: string | null

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
    type: DataType.TEXT,
    allowNull: true,
    field: 'message',
  })
  message!: string | null

  @Column({
    type: DataType.UUID,
    field: 'department_id',
  })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModelRef

  @Column({
    type: DataType.UUID,
    field: 'advert_type_id',
  })
  advertTypeId!: string

  @Column({
    type: DataType.TEXT,
    field: 'advert_html',
  })
  html!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'proposed_advert_id',
  })
  proposedAdvertId?: string

  @Column({
    type: DataType.TEXT,
    field: 'publication_number',
  })
  publicationNumber!: string | null

  @Column({
    field: 'hide_signature_date',
  })
  hideSignatureDate?: boolean

  @BelongsTo(() => AdvertTypeModel, 'advert_type_id')
  advertType!: AdvertTypeModelRef

  @ForeignKey(() => AdvertModel)
  @Column({ type: DataType.UUID, field: 'advert_id', allowNull: true })
  advertId?: string

  @BelongsTo(() => AdvertModel, 'advert_id')
  advert?: AdvertModelRef

  @BelongsToMany(() => AdvertCategoryModel, {
    through: { model: () => CaseCategoriesModel },
  })
  categories?: AdvertCategoryModel[]

  @BelongsToMany(() => CaseChannelModel, {
    through: { model: () => CaseChannelsModel },
  })
  channels?: CaseChannelModel[]

  @HasMany(() => CommentModel)
  comments?: CommentModel[]

  @HasOne(() => SignatureModel)
  signature!: SignatureModelRef

  @BelongsToMany(() => ApplicationAttachmentModel, {
    through: { model: () => CaseAttachmentsModel },
  })
  attachments?: ApplicationAttachmentModel[]

  @BelongsToMany(() => CaseAdditionModel, {
    through: { model: () => CaseAdditionsModel },
  })
  additions?: CaseAdditionModel[]

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'ad',
    field: 'application_type',
  })
  applicationType!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'r_draft_id',
  })
  regulationDraftId?: string

  @ForeignKey(() => CaseTransactionModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'transaction_id',
  })
  transactionId!: string | null

  @BelongsTo(() => CaseTransactionModel)
  transaction?: CaseTransactionModelRef

  @HasMany(() => CaseHistoryModel)
  history!: CaseHistoryModel[]
}
