import { BulkCreateOptions } from 'sequelize'
import {
  BeforeBulkCreate,
  BeforeDestroy,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import { InternalServerErrorException } from '@nestjs/common'
import { PickType } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { getLogger } from '@dmr.is/logging'
import { Paging } from '@dmr.is/shared-dto'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'
import { cleanLegalGazetteLegacyHtml } from '@dmr.is/utils-server/cleanLegacyHtml'

import { LegalGazetteModels } from '../core/constants'
import { StatusIdEnum } from '../core/enums/status.enum'
import { getAdvertHtmlMarkup } from '../core/templates/html'
import { CreateSignatureDto } from '../modules/advert/signature/dto/signature.dto'
import { CreateCommunicationChannelDto } from '../modules/communication-channel/dto/communication-channel.dto'
import { CreateSettlementDto } from '../modules/settlement/dto/settlement.dto'
import { DetailedDto } from '../modules/shared/dto/detailed.dto'
import { QueryDto } from '../modules/shared/dto/query.dto'
import {
  AdvertPublicationDto,
  AdvertPublicationModel,
  AdvertPublicationsCreateAttributes,
  AdvertVersionEnum,
} from './advert-publication.model'
import { ApplicationModel } from './application.model'
import { CaseModel } from './case.model'
import { CategoryDto, CategoryModel } from './category.model'
import { CommentDto, CommentModel, CommentTypeEnum } from './comment.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelDto,
  CommunicationChannelModel,
} from './communication-channel.model'
import { CourtDistrictDto, CourtDistrictModel } from './court-district.model'
import { ForeclosureModel } from './foreclosure.model'
import { ForeclosurePropertyModel } from './foreclosure-property.model'
import {
  SettlementCreateAttributes,
  SettlementDto,
  SettlementModel,
} from './settlement.model'
import {
  SignatureCreationAttributes,
  SignatureDto,
  SignatureModel,
} from './signature.model'
import { StatusDto, StatusModel } from './status.model'
import { TBRTransactionModel } from './tbr-transactions.model'
import { TypeDto, TypeIdEnum, TypeModel } from './type.model'
import { UserDto, UserModel } from './users.model'

export enum AdvertTemplateType {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
  DIVISION_MEETING_BANKRUPTCY = 'DIVISION_MEETING_BANKRUPTCY',
  DIVISION_MEETING_DECEASED = 'DIVISION_MEETING_DECEASED',
  DIVISION_ENDING = 'DIVISION_ENDING',
  FORECLOSURE = 'FORECLOSURE',
}

type AdvertAttributes = {
  caseId: string | null
  templateType: AdvertTemplateType
  islandIsApplicationId: string | null
  applicationId: string | null
  transactionId: string | null
  typeId: string
  categoryId: string
  statusId: string
  assignedUserId: string | null
  publicationNumber: string | null
  title: string
  createdBy: string
  createdByNationalId: string
  legacyHtml?: string | null
  legacyId: string | null
  externalId?: string | null

  // Common specific properties
  caption: string | null
  content: string | null
  additionalText: string | null

  // Recall specific properties
  courtDistrictId: string | null
  judgementDate?: Date | null
  divisionMeetingDate?: Date | null
  divisionMeetingLocation?: string | null
  settlementId?: string | null

  // relations
  type: TypeModel
  category: CategoryModel
  status: StatusModel
  case: CaseModel
  settlement?: SettlementModel
  signature: SignatureModel
  communicationChannels?: CommunicationChannelModel[]
  comments: CommentModel[]
}

export type AdvertCreateAttributes = {
  caseId?: string | null
  templateType?: AdvertTemplateType
  islandIsApplicationId?: string | null
  applicationId?: string | null
  transactionId?: string | null
  typeId: string
  categoryId: string
  statusId?: string
  title: string
  legacyHtml?: string | null
  createdBy: string
  createdByNationalId: string
  externalId?: string | null

  // signature
  signature?: SignatureCreationAttributes

  // Common specific properties
  additionalText?: string | null
  caption?: string | null
  content?: string | null

  // Recall specific properties
  courtDistrictId?: string | null
  settlementId?: string | null
  judgementDate?: Date | null
  divisionMeetingDate?: Date | null
  divisionMeetingLocation?: string | null

  // relations
  publications?: AdvertPublicationsCreateAttributes[]
  settlement?: SettlementCreateAttributes
  communicationChannels?: CommunicationChannelCreateAttributes[]
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@Scopes(() => ({
  listview: {
    include: [
      { model: StatusModel },
      { model: CategoryModel },
      { model: TypeModel },
      // we need to include the comment model to know if we have internal comments
      { model: CommentModel },
      // we need the publication model to get scheduledAt
      { model: AdvertPublicationModel, as: 'publications' },
      // we need user model for assigned user
      { model: UserModel },
    ],
  },
  simpleview: {
    include: [
      { model: StatusModel },
      { model: CategoryModel },
      { model: TypeModel },
      // we need the publication model to get scheduledAt
      { model: AdvertPublicationModel, as: 'publications' },
    ],
  },
  detailed: {
    include: [
      { model: StatusModel },
      { model: CategoryModel },
      { model: CourtDistrictModel },
      { model: TypeModel },
      { model: UserModel, paranoid: false },
      { model: AdvertPublicationModel, as: 'publications' },
      { model: SettlementModel },
      { model: CommunicationChannelModel },
      { model: TBRTransactionModel },
      { model: CommentModel },
      { model: SignatureModel },
      { model: ForeclosureModel, include: [ForeclosurePropertyModel] },
    ],
  },
}))
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(AdvertTemplateType)),
    defaultValue: AdvertTemplateType.COMMON,
    allowNull: false,
  })
  templateType!: AdvertTemplateType

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => CaseModel)
  caseId?: string | null

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => ApplicationModel)
  applicationId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  legacyId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => UserModel)
  assignedUserId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => SettlementModel)
  settlementId?: string | null

  @Column({
    type: DataType.UUID,
  })
  islandIsApplicationId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_type_id',
  })
  @ForeignKey(() => TypeModel)
  typeId!: TypeIdEnum | string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_category_id',
  })
  @ForeignKey(() => CategoryModel)
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_status_id',
    defaultValue: StatusIdEnum.SUBMITTED,
  })
  @ForeignKey(() => StatusModel)
  statusId!: StatusIdEnum

  @Column({
    type: DataType.TEXT,
    unique: true,
    defaultValue: null,
  })
  publicationNumber!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  legacyHtml?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  createdByNationalId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  createdBy!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additionalText?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  caption?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  content?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  divisionMeetingLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  divisionMeetingDate!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  judgementDate?: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  externalId?: string | null

  @Column({ type: DataType.VIRTUAL(DataType.DATE) })
  get nextScheduledAt(): Date | null {
    if (!this.publications || this.publications.length === 0) {
      return null
    }

    const futurePubs = this.publications.filter(
      (pub) => pub.publishedAt === null,
    )

    if (futurePubs.length === 0) {
      return null
    }

    const nextPub = futurePubs.reduce((prev, curr) => {
      return prev.scheduledAt < curr.scheduledAt ? prev : curr
    }, futurePubs[0])

    return nextPub.scheduledAt
  }

  @Column({ type: DataType.VIRTUAL(DataType.DATE) })
  get lastPublishedAt(): Date | null {
    if (!this.publications || this.publications.length === 0) {
      return null
    }

    const pastPubs = this.publications.filter((pub) => pub.publishedAt !== null)

    if (pastPubs.length === 0) {
      return null
    }

    const latestPub = pastPubs.reduce((prev, curr) => {
      if (!prev.publishedAt || !curr.publishedAt) return prev
      return prev.publishedAt > curr.publishedAt ? prev : curr
    }, pastPubs[0])

    if (!latestPub.publishedAt) return null

    return latestPub.publishedAt
  }

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @HasMany(() => CommunicationChannelModel)
  communicationChannels?: CommunicationChannelModel[]

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  @BelongsTo(() => StatusModel)
  status!: StatusModel

  @BelongsTo(() => SettlementModel)
  settlement?: SettlementModel

  @BelongsTo(() => CourtDistrictModel)
  courtDistrict?: CourtDistrictModel

  @BelongsTo(() => UserModel)
  assignedUser?: UserModel

  @HasOne(() => SignatureModel)
  signature?: SignatureModel

  @HasMany(() => AdvertPublicationModel)
  publications!: AdvertPublicationModel[]

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
    field: 'transaction_id',
  })
  @ForeignKey(() => TBRTransactionModel)
  transactionId?: string | null

  @BelongsTo(() => TBRTransactionModel)
  transaction?: TBRTransactionModel

  @HasMany(() => CommentModel)
  comments!: CommentModel[]

  @HasOne(() => ForeclosureModel)
  foreclosure?: ForeclosureModel

  get hasInternalComments(): boolean {
    const found = this.comments.find((c) => c.type === CommentTypeEnum.COMMENT)

    return found ? true : false
  }

  @BeforeDestroy
  static async beforeDestroyHook(instance: AdvertModel) {
    const logger = getLogger('AdvertModel')
    logger.info(`Soft deleting advert ${instance.id}`, {
      advertId: instance.id,
      applicationId: instance.applicationId,
    })
  }

  htmlMarkup(version?: AdvertVersionEnum): string {
    if (this.legacyHtml) {
      return cleanLegalGazetteLegacyHtml(this.legacyHtml)
    }

    try {
      if (version) {
        return getAdvertHtmlMarkup(this, version)
      }

      const latestPub = this.publications
        .filter((pub) => pub.publishedAt !== null)
        .sort((a, b) => {
          if (!a.publishedAt || !b.publishedAt) return 0
          return b.publishedAt.getTime() - a.publishedAt.getTime()
        })[0]

      return getAdvertHtmlMarkup(this, latestPub?.versionLetter)
    } catch (error) {
      const logger = getLogger('AdvertModel')
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error generating HTML markup,', { message })
      throw new InternalServerErrorException()
    }
  }

  @BeforeBulkCreate
  static addIndividualhooks(
    _models: AdvertModel[],
    options: BulkCreateOptions,
  ) {
    this.logger.debug('AfterBulkCreate, setting individualHooks to true')
    options.individualHooks = true
  }

  static canEdit(model: AdvertModel, userId?: string): boolean {
    try {
      const editableStateIds = [
        StatusIdEnum.IN_PROGRESS,
        StatusIdEnum.READY_FOR_PUBLICATION,
        StatusIdEnum.SUBMITTED,
      ]

      return (
        editableStateIds.includes(model.statusId) &&
        model.assignedUserId === userId
      )
    } catch (error) {
      this.logger.error('Error checking canEdit permission', {
        context: 'AdvertModel',
      })
      return false
    }
  }

  canEdit(userId?: string): boolean {
    return AdvertModel.canEdit(this, userId)
  }

  /**
   * Checks if current advert is in a publishable state
   * Admin users do NOT have to be assigned to the advert
   *
   * @param model
   * @returns true | false based on the advert status
   */
  static canPublish(model: AdvertModel): boolean {
    try {
      const allowedStatuses = [
        StatusIdEnum.READY_FOR_PUBLICATION,
        StatusIdEnum.IN_PUBLISHING,
      ]

      return allowedStatuses.includes(model.statusId)
    } catch (error) {
      this.logger.error('Error checking canPublish permission', {
        context: 'AdvertModel',
      })
      return false
    }
  }

  canPublish(): boolean {
    return AdvertModel.canPublish(this)
  }

  static fromModel(model: AdvertModel): AdvertDto {
    try {
      return {
        id: model.id,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        hasInternalComments: model.hasInternalComments,
        deletedAt: model.deletedAt ?? undefined,
        category: model.category.fromModel(),
        type: model.type.fromModel(),
        status: model.status.fromModel(),
        createdBy: model.createdBy,
        scheduledAt: model.nextScheduledAt,
        lastPublishedAt: model.lastPublishedAt,
        title: model.title,
        publicationNumber: model.publicationNumber ?? undefined,
        assignedUser: model.assignedUser?.fromModel(),
        publications: model.publications.map((p) => p.fromModel()),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.warn('Error converting from AdvertModel to AdvertDto', {
        context: 'AdvertModel',
        error: message,
      })
      throw new InternalServerErrorException()
    }
  }

  fromModel(): AdvertDto {
    return AdvertModel.fromModel(this)
  }

  static fromModelToDetailed(
    model: AdvertModel,
    userId?: string,
  ): AdvertDetailedDto {
    return {
      ...this.fromModel(model),
      createdByNationalId: model.createdByNationalId,
      canPublish: this.canPublish(model),
      caseId: model.caseId ?? undefined,
      templateType: model.templateType,
      canEdit: this.canEdit(model, userId),
      publicationNumber: model.publicationNumber ?? undefined,
      signature: model.signature?.fromModel(),
      caption: model.caption ?? undefined,
      content: model.content ?? undefined,
      additionalText: model.additionalText ?? undefined,
      isAssignedToMe: model.assignedUserId === userId,
      courtDistrict: model.courtDistrict?.fromModel()
        ? model.courtDistrict.fromModel()
        : undefined,
      judgementDate: model.judgementDate ?? undefined,
      divisionMeetingDate: model.divisionMeetingDate ?? undefined,
      divisionMeetingLocation: model.divisionMeetingLocation ?? undefined,
      settlement: model.settlement?.fromModel(),
      communicationChannels:
        model.communicationChannels?.map((c) => c.fromModel()) ?? [],
      paidAt: model.transaction?.paidAt ?? undefined,
      totalPrice: model.transaction?.totalPrice
        ? model.transaction.totalPrice
        : undefined,
      comments: model.comments?.map((c) => c.fromModel()) || [],
    }
  }

  fromModelToDetailed(userId?: string): AdvertDetailedDto {
    return AdvertModel.fromModelToDetailed(this, userId)
  }

  static fromModelToSimple(model: AdvertModel): AdvertDto {
    try {
      return {
        id: model.id,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        hasInternalComments: false,
        deletedAt: model.deletedAt ?? undefined,
        category: model.category.fromModel(),
        type: model.type.fromModel(),
        status: model.status.fromModel(),
        createdBy: model.createdBy,
        scheduledAt: model.nextScheduledAt,
        lastPublishedAt: model.lastPublishedAt,
        title: model.title,
        publications: model.publications.map((p) => p.fromModel()),
      }
    } catch (error) {
      this.logger.warn(
        'Error converting from AdvertModel to ExternalAdvertDto',
        {
          context: 'AdvertModel',
        },
      )
      throw new InternalServerErrorException()
    }
  }

  fromModelToSimple(): AdvertDto {
    return AdvertModel.fromModelToSimple(this)
  }

  static fromModelToExternal(model: AdvertModel): ExternalAdvertDto {
    try {
      return {
        id: model.id,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        category: model.category.title,
        type: model.type.title,
        status: model.status.title,
        createdBy: model.createdBy,
        scheduledAt: model.nextScheduledAt,
        lastPublishedAt: model.lastPublishedAt,
        externalId: model.externalId ?? undefined,
        title: model.title,
        caption: model.caption ?? undefined,
        content: model.content ?? undefined,
      }
    } catch (error) {
      this.logger.warn(
        'Error converting from AdvertModel to ExternalAdvertDto',
        {
          context: 'AdvertModel',
        },
      )
      throw new InternalServerErrorException()
    }
  }

  fromModelToExternal(): ExternalAdvertDto {
    return AdvertModel.fromModelToExternal(this)
  }
}

export class AdvertDetailedDto extends DetailedDto {
  @ApiUUId()
  id!: string

  @ApiEnum(AdvertTemplateType, { enumName: 'AdvertTemplateType' })
  templateType!: AdvertTemplateType

  @ApiOptionalUuid()
  caseId?: string

  @ApiString()
  title!: string

  @ApiString()
  createdBy!: string

  @ApiString()
  createdByNationalId!: string

  @ApiOptionalString()
  caption?: string

  @ApiOptionalString()
  content?: string

  @ApiOptionalString()
  publicationNumber?: string

  @ApiOptionalString()
  additionalText?: string

  @ApiOptionalDateTime()
  judgementDate?: Date

  @ApiOptionalDateTime()
  divisionMeetingDate?: Date

  @ApiOptionalString()
  divisionMeetingLocation?: string

  @ApiBoolean()
  canEdit!: boolean

  @ApiBoolean()
  canPublish!: boolean

  @ApiBoolean()
  isAssignedToMe!: boolean

  @ApiOptionalDto(CourtDistrictDto)
  courtDistrict?: CourtDistrictDto

  @ApiOptionalDto(SettlementDto)
  settlement?: SettlementDto

  @ApiDtoArray(CommunicationChannelDto)
  communicationChannels!: CommunicationChannelDto[]

  @ApiDtoArray(AdvertPublicationDto)
  publications!: AdvertPublicationDto[]

  @ApiDto(CategoryDto)
  category!: CategoryDto

  @ApiDto(TypeDto)
  type!: TypeDto

  @ApiDto(StatusDto)
  status!: StatusDto

  @ApiOptionalDateTime()
  scheduledAt!: Date | null

  @ApiOptionalDateTime()
  lastPublishedAt!: Date | null

  @ApiOptionalDto(UserDto)
  assignedUser?: UserDto

  @ApiBoolean()
  hasInternalComments!: boolean

  @ApiDtoArray(CommentDto)
  comments!: CommentDto[]

  @ApiOptionalDto(SignatureDto)
  signature?: SignatureDto

  @ApiOptionalDateTime()
  paidAt?: Date

  @ApiOptionalNumber()
  totalPrice?: number
}

export class AdvertDto extends PickType(AdvertDetailedDto, [
  'id',
  'title',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'hasInternalComments',
  'category',
  'type',
  'status',
  'scheduledAt',
  'assignedUser',
  'publications',
  'publicationNumber',
] as const) {
  @ApiOptionalDateTime()
  lastPublishedAt!: Date | null
}

export class ExternalAdvertDto extends PickType(AdvertDetailedDto, [
  'id',
  'title',
  'createdAt',
  'updatedAt',
  'createdBy',
  'scheduledAt',
  'caption',
  'content',
  'lastPublishedAt',
] as const) {
  @ApiOptionalString()
  externalId?: string

  @ApiString()
  category!: string

  @ApiString()
  type!: string

  @ApiString()
  status!: string
}
