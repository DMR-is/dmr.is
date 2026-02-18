import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
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
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'

import { getLogger } from '@dmr.is/logging'
import { Paging } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'
import { cleanLegalGazetteLegacyHtml } from '@dmr.is/utils/server/cleanLegacyHtml'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
import { QueryDto } from '../core/dto/query.dto'
import { StatusIdEnum } from '../core/enums/status.enum'
import { getAdvertHtmlMarkup } from '../core/templates/html'
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
  CreateCommunicationChannelDto,
} from './communication-channel.model'
import { CourtDistrictDto, CourtDistrictModel } from './court-district.model'
import { ForeclosureModel } from './foreclosure.model'
import { ForeclosurePropertyModel } from './foreclosure-property.model'
import {
  CreateSettlementDto,
  SettlementCreateAttributes,
  SettlementDto,
  SettlementModel,
} from './settlement.model'
import {
  CreateSignatureDto,
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
  @ApiProperty({ enum: AdvertTemplateType, enumName: 'AdvertTemplateType' })
  templateType!: AdvertTemplateType

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => CaseModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  caseId?: string | null

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => ApplicationModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  applicationId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  legacyId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => UserModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  assignedUserId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CourtDistrictModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  courtDistrictId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => SettlementModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementId?: string | null

  @Column({
    type: DataType.UUID,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  islandIsApplicationId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_type_id',
  })
  @ForeignKey(() => TypeModel)
  @ApiProperty({ type: String })
  @IsString()
  typeId!: TypeIdEnum | string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_category_id',
  })
  @ForeignKey(() => CategoryModel)
  @ApiProperty({ type: String })
  @IsString()
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_status_id',
    defaultValue: StatusIdEnum.SUBMITTED,
  })
  @ForeignKey(() => StatusModel)
  @ApiProperty({ type: String })
  statusId!: StatusIdEnum

  @Column({
    type: DataType.TEXT,
    unique: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, nullable: true })
  publicationNumber!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  @IsString()
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  legacyHtml?: string | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  createdByNationalId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  createdBy!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  additionalText?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  caption?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  content?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingDate!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false })
  judgementDate?: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  externalId?: string | null

  @Column({ type: DataType.VIRTUAL(DataType.DATE) })
  get nextScheduledAt(): string | null {
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

    return nextPub.scheduledAt.toISOString()
  }

  @Column({ type: DataType.VIRTUAL(DataType.DATE) })
  get lastPublishedAt(): string | null {
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

    return latestPub.publishedAt.toISOString()
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
  @ApiProperty({ type: String, required: false, nullable: true })
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
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        hasInternalComments: model.hasInternalComments,
        deletedAt: model.deletedAt?.toISOString(),
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
      judgementDate: model.judgementDate?.toISOString(),
      divisionMeetingDate: model.divisionMeetingDate?.toISOString(),
      divisionMeetingLocation: model.divisionMeetingLocation ?? undefined,
      settlement: model.settlement?.fromModel(),
      communicationChannels:
        model.communicationChannels?.map((c) => c.fromModel()) ?? [],
      paidAt: model.transaction?.paidAt
        ? model.transaction.paidAt?.toISOString()
        : undefined,
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
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        hasInternalComments: false,
        deletedAt: model.deletedAt?.toISOString(),
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
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
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
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ enum: AdvertTemplateType, enumName: 'AdvertTemplateType' })
  @IsEnum(AdvertTemplateType)
  templateType!: AdvertTemplateType

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  caseId?: string

  @ApiProperty({ type: String })
  @IsString()
  title!: string

  @ApiProperty({ type: String })
  @IsString()
  createdBy!: string

  @ApiProperty({ type: String })
  @IsString()
  createdByNationalId!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  caption?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  content?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  publicationNumber?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  judgementDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  divisionMeetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  divisionMeetingLocation?: string

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  canEdit!: boolean

  @ApiProperty({ type: Boolean })
  canPublish!: boolean

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAssignedToMe!: boolean

  @ApiProperty({ type: CourtDistrictDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourtDistrictDto)
  courtDistrict?: CourtDistrictDto

  @ApiProperty({ type: SettlementDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettlementDto)
  settlement?: SettlementDto

  @ApiProperty({ type: [CommunicationChannelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunicationChannelDto)
  communicationChannels!: CommunicationChannelDto[]

  @ApiProperty({ type: [AdvertPublicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvertPublicationDto)
  publications!: AdvertPublicationDto[]

  @ApiProperty({ type: CategoryDto })
  @ValidateNested()
  @Type(() => CategoryDto)
  category!: CategoryDto

  @ApiProperty({ type: TypeDto })
  @ValidateNested()
  @Type(() => TypeDto)
  type!: TypeDto

  @ApiProperty({ type: StatusDto })
  @ValidateNested()
  @Type(() => StatusDto)
  status!: StatusDto

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsDateString()
  lastPublishedAt!: string | null

  @ApiProperty({ type: UserDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  assignedUser?: UserDto

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  hasInternalComments!: boolean

  @ApiProperty({ type: [CommentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentDto)
  comments!: CommentDto[]

  @ApiProperty({ type: SignatureDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SignatureDto)
  signature?: SignatureDto

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  paidAt?: string

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
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
  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsDateString()
  lastPublishedAt!: string | null
}

export class GetAdvertsDto {
  @ApiProperty({ type: [AdvertDto] })
  adverts!: AdvertDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
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
  @ApiProperty({ type: String, required: false })
  externalId?: string
  @ApiProperty({ type: String })
  category!: string
  @ApiProperty({ type: String })
  type!: string
  @ApiProperty({ type: String })
  status!: string
}

export class GetExternalAdvertsDto {
  @ApiProperty({ type: [ExternalAdvertDto] })
  adverts!: ExternalAdvertDto[]
}

export class GetAdvertsQueryDto extends QueryDto {
  @ApiProperty({
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryId?: string[]

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  statusId?: string[]

  @ApiProperty({
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  typeId?: string[]

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsArray()
  @IsOptional()
  externalId?: string[]
}

export class AdvertTabCountItemDto {
  @ApiProperty({ type: Number })
  count!: number
}

export class GetAdvertsStatusCounterDto {
  @ApiProperty({ type: AdvertTabCountItemDto })
  submittedTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  readyForPublicationTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  inPublishingTab!: AdvertTabCountItemDto

  @ApiProperty({ type: AdvertTabCountItemDto })
  finishedTab!: AdvertTabCountItemDto
}

// ============================================================================
// My Adverts DTOs (for application-web users to view their submitted adverts)
// ============================================================================

export class MyAdvertListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  legacyId!: string | null

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String, nullable: true })
  publicationNumber!: string | null

  @ApiProperty({ type: TypeDto })
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null

  @ApiProperty({ type: String, nullable: true })
  html!: string | null
}

export class GetMyAdvertsDto {
  @ApiProperty({ type: [MyAdvertListItemDto] })
  adverts!: MyAdvertListItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateAdvertInternalDto extends PickType(AdvertModel, [
  'caseId',
  'islandIsApplicationId',
  'typeId',
  'title',
  'categoryId',
  'legacyHtml',
  'createdBy',
  'createdByNationalId',
  'additionalText',
  'caption',
  'content',
  'courtDistrictId',
  'settlementId',
  'divisionMeetingLocation',
  'externalId',
] as const) {
  @ApiProperty({
    enum: AdvertTemplateType,
    enumName: 'AdvertTemplateType',
    required: false,
    description: 'Template type of the advert',
  })
  @IsOptional()
  @IsEnum(AdvertTemplateType)
  templateType?: AdvertTemplateType

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  isFromExternalSystem?: boolean

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({
    type: String,
    description: 'Date of signature',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  statusId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  judgementDate?: string | null

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  divisionMeetingDate?: string | null

  @ApiProperty({
    type: [String],
    description: 'List of scheduled publication dates',
  })
  @IsArray()
  @IsDateString(undefined, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  scheduledAt!: string[]

  @ApiProperty({ type: CreateSignatureDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSignatureDto)
  signature?: CreateSignatureDto

  @ApiProperty({
    type: [CreateCommunicationChannelDto],
    description: 'List of communication channels for notifications',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommunicationChannelDto)
  communicationChannels?: CreateCommunicationChannelDto[]

  @ApiProperty({
    type: CreateSettlementDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSettlementDto)
  settlement?: CreateSettlementDto | null
}

export class CreateAdvertDto extends OmitType(CreateAdvertInternalDto, [
  'statusId',
  'createdBy',
  'createdByNationalId',
  'islandIsApplicationId',
] as const) {}

export class UpdateAdvertDto extends PartialType(
  PickType(AdvertDetailedDto, [
    'content',
    'additionalText',
    'caption',
    'divisionMeetingDate',
    'divisionMeetingLocation',
    'judgementDate',
    'title',
  ] as const),
) {
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsDateString(undefined, { each: true })
  @MinLength(1, { each: true })
  @MaxLength(3, { each: true })
  scheduledAt?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string
}

export class PublishAdvertsBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  advertIds!: string[]
}

export class CreateAdvertResponseDto {
  @ApiProperty({ type: String })
  id!: string
}
