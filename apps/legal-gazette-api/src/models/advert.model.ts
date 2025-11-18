import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { BulkCreateOptions, Op, WhereOptions } from 'sequelize'
import {
  BeforeBulkCreate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger'

import { getLogger } from '@dmr.is/logging'
import { Paging, PagingQuery } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'
import { cleanLegacyHtml } from '@dmr.is/utils'

import { DetailedDto } from '../dto/detailed.dto'
import { LegalGazetteModels } from '../lib/constants'
import { getAdvertHTMLMarkup } from '../lib/templates'
import {
  AdvertPublicationDto,
  AdvertPublicationModel,
  AdvertPublicationsCreateAttributes,
} from './advert-publication.model'
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
import { StatusDto, StatusIdEnum, StatusModel } from './status.model'
import { TBRTransactionModel } from './tbr-transactions.model'
import { TypeDto, TypeIdEnum, TypeModel } from './type.model'
import { UserModel } from './users.model'

type AdvertAttributes = {
  caseId: string | null
  islandIsApplicationId: string | null
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

  // signature
  signatureName?: string | null
  signatureOnBehalfOf?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null

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
  communicationChannels?: CommunicationChannelModel[]
  comments: CommentModel[]
}

export type AdvertCreateAttributes = {
  caseId?: string | null
  islandIsApplicationId?: string | null
  typeId: string
  categoryId: string
  statusId?: string
  title: string
  legacyHtml?: string | null
  createdBy: string
  createdByNationalId: string

  // signature
  signatureName?: string | null
  signatureOnBehalfOf?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null

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

export enum AdvertVersionEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  include: [
    { model: StatusModel },
    { model: CategoryModel },
    { model: CourtDistrictModel },
    { model: TypeModel },
    { model: UserModel },
    { model: AdvertPublicationModel },
    { model: SettlementModel },
    { model: CommunicationChannelModel },
    { model: TBRTransactionModel },
    { model: CommentModel },
    { model: ForeclosureModel, include: [ForeclosurePropertyModel] },
  ],
  order: [
    [
      { model: AdvertPublicationModel, as: 'publications' },
      'scheduledAt',
      'ASC',
    ],
  ],
}))
@Scopes(() => ({
  withQuery: (query: GetAdvertsQueryDto) => {
    const whereOptions: WhereOptions = {}

    if (query.typeId) {
      Object.assign(whereOptions, { typeId: { [Op.in]: query.typeId } })
    }

    if (query.categoryId) {
      Object.assign(whereOptions, { categoryId: { [Op.in]: query.categoryId } })
    }

    if (query.statusId) {
      Object.assign(whereOptions, { statusId: { [Op.in]: query.statusId } })
    }

    if (query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.between]: [query.dateFrom, query.dateTo],
        },
      })
    }

    if (query.dateFrom && !query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.gte]: query.dateFrom,
        },
      })
    }

    if (!query.dateFrom && query.dateTo) {
      Object.assign(whereOptions, {
        createdAt: {
          [Op.lte]: query.dateTo,
        },
      })
    }

    if (query.search) {
      Object.assign(whereOptions, {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query.search}%` } },
          { content: { [Op.iLike]: `%${query.search}%` } },
          { caption: { [Op.iLike]: `%${query.search}%` } },
        ],
      })
    }

    return {
      include: [
        { model: StatusModel },
        { model: CategoryModel },
        { model: CourtDistrictModel },
        { model: TypeModel },
        { model: UserModel },
        { model: AdvertPublicationModel },
        { model: SettlementModel },
        { model: CommunicationChannelModel },
        { model: TBRTransactionModel },
        { model: CommentModel },
        { model: ForeclosureModel },
      ],
      where: whereOptions,
    }
  },
}))
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
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
  typeId!: TypeIdEnum | string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_category_id',
  })
  @ForeignKey(() => CategoryModel)
  @ApiProperty({ type: String })
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
  @ApiProperty({ type: String, required: false, nullable: true })
  publicationNumber!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
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
    type: DataType.STRING(100),
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureName?: string | null

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureOnBehalfOf?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureDate?: Date | null

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
  @ApiProperty({ type: String, required: false, nullable: true })
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
  @ApiProperty({ type: String, required: false, nullable: true })
  judgementDate?: Date | null

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @HasMany(() => CommunicationChannelModel)
  communicationChannels!: CommunicationChannelModel[]

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

  @HasMany(() => AdvertPublicationModel)
  publications!: AdvertPublicationModel[]

  @HasOne(() => TBRTransactionModel)
  transaction?: TBRTransactionModel

  @HasMany(() => CommentModel)
  comments!: CommentModel[]

  @HasOne(() => ForeclosureModel)
  foreclosure?: ForeclosureModel

  get hasInternalComments(): boolean {
    const found = this.comments.find((c) => c.type === CommentTypeEnum.COMMENT)

    return found ? true : false
  }

  htmlMarkup(version: AdvertVersionEnum): string {
    if (this.legacyHtml) {
      return cleanLegacyHtml(this.legacyHtml)
    }

    try {
      return getAdvertHTMLMarkup(this, version)
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

  static async countByStatus(
    statusId: StatusIdEnum,
  ): Promise<AdvertStatusCounterItemDto> {
    this.logger.info(`Counting adverts with status ID: ${statusId}`, {
      context: 'AdvertModel',
    })

    const [status, count] = await Promise.all([
      StatusModel.findByPk(statusId),
      this.count({
        where: {
          statusId,
        },
      }),
    ])

    if (!status) {
      this.logger.error(`Advert status with ID ${statusId} not found`, {
        context: 'AdvertModel',
      })

      throw new BadRequestException('Invalid advert status')
    }

    return {
      status: {
        id: status.id,
        title: status.title,
        slug: status.slug,
      },
      count,
    }
  }

  static canEdit(model: AdvertModel, userId?: string): boolean {
    try {
      const editableStateIds = [
        StatusIdEnum.IN_PROGRESS,
        StatusIdEnum.READY_FOR_PUBLICATION,
        StatusIdEnum.SUBMITTED,
      ]

      if (
        editableStateIds.includes(model.statusId) &&
        model.assignedUserId === userId
      ) {
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  canEdit(userId?: string): boolean {
    return AdvertModel.canEdit(this, userId)
  }

  static fromModel(model: AdvertModel): AdvertDto {
    const publishing = model.publications.find(
      (pub) => pub.publishedAt === null,
    )

    const date = publishing
      ? publishing.scheduledAt
      : model.publications[model.publications.length - 1].scheduledAt

    try {
      return {
        id: model.id,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        hasInternalComments: model.hasInternalComments,
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
        category: model.category.fromModel(),
        type: model.type.fromModel(),
        status: model.status.fromModel(),
        createdBy: model.createdBy,
        scheduledAt: date.toISOString(),
        title: model.title,
        assignedUser: model.assignedUser?.id,
        publications: model.publications.map((p) => p.fromModel()),
      }
    } catch (error) {
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
      caseId: model.caseId ?? undefined,
      canEdit: this.canEdit(model, userId),
      publicationNumber: model.publicationNumber,
      signatureOnBehalfOf: model.signatureOnBehalfOf ?? undefined,
      signatureDate: model.signatureDate?.toISOString(),
      signatureLocation: model.signatureLocation ?? undefined,
      signatureName: model.signatureName ?? undefined,
      caption: model.caption,
      content: model.content,
      additionalText: model.additionalText,
      courtDistrict: model.courtDistrict?.fromModel()
        ? model.courtDistrict.fromModel()
        : undefined,
      judgementDate: model.judgementDate
        ? model.judgementDate?.toISOString()
        : undefined,
      divisionMeetingDate: model.divisionMeetingDate
        ? model.divisionMeetingDate?.toISOString()
        : undefined,
      divisionMeetingLocation: model.divisionMeetingLocation ?? undefined,
      settlement: model.settlement?.fromModel(),
      communicationChannels: model.communicationChannels?.map((c) =>
        c.fromModel(),
      ),
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
}

export class AdvertDetailedDto extends IntersectionType(
  DetailedDto,
  PickType(AdvertModel, [
    'id',
    'title',
    'hasInternalComments',
    'createdBy',
    'caption',
    'content',
    'publicationNumber',
    'additionalText',
    'signatureLocation',
    'signatureName',
    'signatureOnBehalfOf',
    'divisionMeetingLocation',
  ] as const),
) {
  @ApiProperty({ type: String, required: false })
  caseId?: string

  @ApiProperty({ type: String, required: false })
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  judgementDate?: string

  @ApiProperty({ type: String, required: false })
  divisionMeetingDate?: string

  @ApiProperty({ type: Boolean })
  canEdit!: boolean

  @ApiProperty({ type: CourtDistrictDto, required: false })
  courtDistrict?: CourtDistrictDto

  @ApiProperty({ type: SettlementDto, required: false })
  settlement?: SettlementDto

  @ApiProperty({ type: [CommunicationChannelDto], required: false })
  communicationChannels?: CommunicationChannelDto[]

  @ApiProperty({ type: [AdvertPublicationDto] })
  publications!: AdvertPublicationDto[]

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ type: TypeDto })
  type!: TypeDto

  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: String })
  scheduledAt!: string

  @ApiProperty({ type: String, required: false })
  assignedUser?: string

  @ApiProperty({ type: [CommentDto] })
  comments!: CommentDto[]

  @ApiProperty({ type: String, required: false })
  paidAt?: string

  @ApiProperty({ type: Number, required: false })
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
] as const) {}

export class GetAdvertsDto {
  @ApiProperty({ type: [AdvertDto] })
  adverts!: AdvertDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetAdvertsQueryDto extends PagingQuery {
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

  @ApiProperty({
    enum: StatusIdEnum,
    enumName: 'StatusIdEnum',
    'x-enumNames': [
      'Submitted',
      'ReadyForPublication',
      'Published',
      'Rejected',
      'Withdrawn',
    ],
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StatusIdEnum, { each: true })
  statusId?: StatusIdEnum[]

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

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateFrom?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dateTo?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string
}

export class AdvertStatusCounterItemDto {
  @ApiProperty({ type: StatusDto })
  status!: StatusDto

  @ApiProperty({ type: Number })
  count!: number
}

export class GetAdvertsStatusCounterDto {
  @ApiProperty({ type: AdvertStatusCounterItemDto })
  submitted!: AdvertStatusCounterItemDto

  @ApiProperty({ type: AdvertStatusCounterItemDto })
  readyForPublication!: AdvertStatusCounterItemDto

  @ApiProperty({ type: AdvertStatusCounterItemDto })
  withdrawn!: AdvertStatusCounterItemDto

  @ApiProperty({ type: AdvertStatusCounterItemDto })
  rejected!: AdvertStatusCounterItemDto

  @ApiProperty({ type: AdvertStatusCounterItemDto })
  published!: AdvertStatusCounterItemDto
}

export class CreateAdvertDto extends PickType(AdvertModel, [
  'caseId',
  'islandIsApplicationId',
  'typeId',
  'title',
  'categoryId',
  'legacyHtml',
  'createdBy',
  'createdByNationalId',
  'signatureName',
  'signatureOnBehalfOf',
  'signatureLocation',
  'additionalText',
  'caption',
  'content',
  'courtDistrictId',
  'settlementId',
  'divisionMeetingLocation',
] as const) {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date of signature',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  signatureDate?: string | null

  @ApiProperty({
    enum: StatusIdEnum,
    enumName: 'StatusIdEnum',
    required: false,
    description: 'Status of the advert',
  })
  @IsOptional()
  @IsEnum(StatusIdEnum)
  statusId?: StatusIdEnum

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
    description: 'Date of judgement',
  })
  @IsOptional()
  @IsDateString()
  judgementDate?: string | null

  @ApiProperty({ type: String })
  @IsOptional()
  @IsDateString()
  divisionMeetingDate?: string | null

  @ApiProperty({
    type: [String],
    description: 'List of scheduled publication dates',
  })
  @IsArray()
  @IsDateString(undefined, { each: true })
  @MinLength(1, { each: true })
  @MaxLength(3, { each: true })
  scheduledAt!: string[]

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

export class UpdateAdvertDto extends PartialType(
  PickType(CreateAdvertDto, [
    'scheduledAt',
    'content',
    'categoryId',
    'typeId',
    'additionalText',
    'caption',
    'signatureName',
    'signatureLocation',
    'signatureOnBehalfOf',
    'signatureDate',
    'divisionMeetingDate',
    'divisionMeetingLocation',
    'judgementDate',
    'courtDistrictId',
    'title',
  ] as const),
) {}

export class PublishAdvertsBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  advertIds!: string[]
}
