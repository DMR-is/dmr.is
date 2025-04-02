import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Scopes,
  Sequelize,
  Table,
} from 'sequelize-typescript'

import { CaseAdditionModel } from './case-addition.model'
import { CaseAdditionsModel } from './case-additions.model'
import { CaseCategoriesModel } from './case-categories.model'
import { CaseChannelModel } from './case-channel.model'
import { CaseChannelsModel } from './case-channels.model'
import { CaseCommunicationStatusModel } from './case-communication-status.model'
import { CaseHistoryModel } from './case-history.model'
import { CaseStatusModel } from './case-status.model'
import { CaseTagModel } from './case-tag.model'
import { CaseTransactionModel } from './case-transaction.model'
import { OfficialJournalModels } from '../constants'
import { AdvertTypeModel } from '../advert-type/advert-type.model'
import { ApplicationAttachmentModel } from '../attachment/application-attachment.model'
import { CaseAttachmentsModel } from '../attachment/case-attachments.model'
import { CommentModel } from '../comment/comment.model'
import { AdvertCategoryModel } from '../journal/advert-category.model'
import { AdvertDepartmentModel } from '../journal/advert-department.model'
import { AdvertInvolvedPartyModel } from '../institution/institution.model'
import { AdvertModel } from '../journal/advert.model'
import { SignatureModel } from '../signature/signature.model'
import { UserModel } from '../user/user.model'
import { UserRoleModel } from '../user/user-role.model'
import { CaseActionModel } from '../comment/case-action.model'
import { AdvertCorrectionModel } from '../journal/advert-correction.model'
import { ApplicationAttachmentTypeModel } from '../attachment/application-attachment-type.model'
import { SignatureRecordModel } from '../signature/signature-record.model'
import { SignatureMemberModel } from '../signature/signature-member.model'
import { Op } from 'sequelize'
import { logger } from '@dmr.is/logging'

const LOGGING_CONTEXT = 'CaseModel'

type CaseCreateAttributes = {
  applicationId?: string
  year: number
  caseNumber: string
  departmentId: string
  advertTypeId: string
  tagId: string
  statusId: string
  involvedPartyId: string
  communicationStatusId: string
  advertTitle: string
  requestedPublicationDate: string
  fastTrack: boolean
  createdAt: string
  updatedAt: string
  assignedUserId?: string | null
  publishedAt?: string | null
  message?: string | null
  html?: string | null
  isLegacy?: boolean
}

@Table({ tableName: OfficialJournalModels.CASE, timestamps: false })
@DefaultScope(() => ({
  benchmark: true,
  distinct: true,
  attributes: [
    'id',
    'requestedPublicationDate',
    'createdAt',
    'year',
    'advertTitle',
    'fastTrack',
    'publishedAt',
    'publicationNumber',
  ],
  logging: (_, timing) => {
    logger.info(`getCasesSqlQuery executed in ${timing}ms`, {
      context: LOGGING_CONTEXT,
    })
  },
}))
@Scopes(() => ({
  detailed: {
    include: [
      CaseTagModel,
      CaseStatusModel,
      CaseCommunicationStatusModel,
      AdvertDepartmentModel,
      AdvertTypeModel,
      AdvertCategoryModel,
      CaseChannelModel,
      AdvertInvolvedPartyModel,
      CaseAdditionModel,
      CaseTransactionModel,
      {
        model: AdvertModel,
        include: [AdvertCorrectionModel],
      },
      {
        model: ApplicationAttachmentModel,
        where: { deleted: false },
        required: false,
        include: [ApplicationAttachmentTypeModel],
      },
      {
        model: UserModel,
        include: [
          { model: UserRoleModel },
          { model: AdvertInvolvedPartyModel },
        ],
      },
      {
        model: CommentModel,
        separate: true,
        include: [
          {
            model: CaseStatusModel,
            attributes: ['id', 'title', 'slug'],
            as: 'createdCaseStatus',
          },
          {
            model: CaseActionModel,
            attributes: ['id', 'title', 'slug'],
          },
          {
            model: UserModel,
            as: 'userCreator',
          },
          {
            model: UserModel,
            as: 'userReceiver',
          },
          {
            model: AdvertInvolvedPartyModel,
            attributes: ['id', 'title', 'slug'],
          },
          {
            model: CaseStatusModel,
            attributes: ['id', 'title', 'slug'],
            as: 'caseStatusReceiver',
          },
        ],
      },
      {
        model: CaseHistoryModel,
        include: [
          { model: CaseStatusModel, attributes: ['id', 'title', 'slug'] },
          { model: AdvertDepartmentModel, attributes: ['id', 'title', 'slug'] },
          { model: AdvertTypeModel, attributes: ['id', 'title', 'slug'] },
          {
            model: AdvertInvolvedPartyModel,
            attributes: ['id', 'title', 'slug'],
          },
          { model: UserModel },
        ],
      },
      {
        model: SignatureModel,
        include: [
          AdvertInvolvedPartyModel,
          {
            model: SignatureRecordModel,
            as: 'records',
            separate: true,
            include: [
              {
                model: SignatureMemberModel,
                as: 'chairman',
              },
              {
                model: SignatureMemberModel,
                as: 'members',
                separate: true,
                required: false,
                include: [
                  {
                    model: SignatureRecordModel,
                    required: false,
                  },
                ],
                where: {
                  [Op.or]: [
                    // Exclude chairman using Sequelize.where
                    Sequelize.where(
                      Sequelize.col('SignatureMemberModel.id'),
                      Op.ne,
                      Sequelize.col('record.chairman_id'),
                    ),
                    // Include all members if chairman_id is NULL
                    Sequelize.where(
                      Sequelize.col('record.chairman_id'),
                      Op.is,
                      null,
                    ),
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
}))
export class CaseModel extends Model<CaseModel, CaseCreateAttributes> {
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
  status!: CaseStatusModel

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
  involvedParty!: AdvertInvolvedPartyModel

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
  assignedUser?: UserModel

  @Column({ type: DataType.UUID, field: 'case_communication_status_id' })
  communicationStatusId!: string

  @BelongsTo(() => CaseCommunicationStatusModel, 'case_communication_status_id')
  communicationStatus!: CaseCommunicationStatusModel

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
  department!: AdvertDepartmentModel

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
    type: DataType.TEXT,
    field: 'publication_number',
  })
  publicationNumber!: string | null

  @BelongsTo(() => AdvertTypeModel, 'advert_type_id')
  advertType!: AdvertTypeModel

  @ForeignKey(() => AdvertModel)
  @Column({ type: DataType.UUID, field: 'advert_id', allowNull: true })
  advertId?: string

  @BelongsTo(() => AdvertModel, 'advert_id')
  advert?: AdvertModel

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
  signature!: SignatureModel

  @BelongsToMany(() => ApplicationAttachmentModel, {
    through: { model: () => CaseAttachmentsModel },
  })
  attachments?: ApplicationAttachmentModel[]

  @BelongsToMany(() => CaseAdditionModel, {
    through: { model: () => CaseAdditionsModel },
  })
  additions?: CaseAdditionModel[]

  @ForeignKey(() => CaseTransactionModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'transaction_id',
  })
  transactionId!: string | null

  @BelongsTo(() => CaseTransactionModel)
  transaction?: CaseTransactionModel

  @HasMany(() => CaseHistoryModel)
  history!: CaseHistoryModel[]
}
