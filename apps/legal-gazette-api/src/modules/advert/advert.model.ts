import { BulkCreateOptions, Op, WhereOptions } from 'sequelize'
import {
  BeforeBulkCreate,
  BeforeUpdate,
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

import { getLogger } from '@dmr.is/logging'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'
import { cleanLegacyHtml } from '@dmr.is/utils'

import { LegalGazetteModels } from '../../lib/constants'
import { getAdvertHTMLMarkup } from '../../lib/templates'
import {
  AdvertPublicationModel,
  AdvertPublicationsCreateAttributes,
} from '../advert-publications/advert-publication.model'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { CommentModel } from '../comment/comment.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from '../communication-channel/communication-channel.model'
import { CourtDistrictModel } from '../court-district/court-district.model'
import { ForeclosureModel } from '../foreclosure/foreclosure.model'
import { ForeclosurePropertyModel } from '../foreclosure/foreclosure-property.model'
import {
  SettlementCreateAttributes,
  SettlementModel,
} from '../settlement/settlement.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TBRTransactionModel } from '../tbr-transaction/tbr-transactions.model'
import { TypeIdEnum, TypeModel } from '../type/type.model'
import { UserModel } from '../users/users.model'
import {
  AdvertDetailedDto,
  AdvertDto,
  AdvertStatusCounterItemDto,
  GetAdvertsQueryDto,
} from './dto/advert.dto'

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
  legacyHtml: string | null
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
  caseId?: string
  islandIsApplicationId?: string | null
  typeId: string
  categoryId: string
  statusId?: string
  title: string
  legacyHtml?: string
  createdBy: string
  createdByNationalId: string

  // signature
  signatureName?: string | null
  signatureOnBehalfOf?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null

  // Common specific properties
  additionalText: string | null
  caption: string | null
  content: string | null

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
  caseId!: string | null

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
  assignedUserId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => SettlementModel)
  settlementId!: string | null

  @Column({
    type: DataType.UUID,
  })
  islandIsApplicationId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_type_id',
  })
  @ForeignKey(() => TypeModel)
  typeId!: TypeIdEnum

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
  legacyHtml!: string | null

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
    type: DataType.STRING(100),
    allowNull: true,
  })
  signatureName?: string | null

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  signatureOnBehalfOf?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  signatureLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  signatureDate?: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additionalText!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  caption!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  content!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  divisionMeetingLocation!: string | null

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
  judgementDate!: Date | null

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

  @BeforeUpdate
  static validateUpdate(instance: AdvertModel) {
    // validateAdvertStatus(instance)
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

  fromModel(): AdvertDto {
    return AdvertModel.fromModel(this)
  }

  static fromModelToDetailed(
    model: AdvertModel,
    userId?: string,
  ): AdvertDetailedDto {
    return {
      ...this.fromModel(model),
      caseId: model.caseId || undefined,
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
