// Association annotations use a type-only alias - see `models.md`.
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

import { getLogger } from '@dmr.is/logging'
import { ParanoidModel, ParanoidTable } from '@dmr.is/shared-models-base'
import { cleanLegalGazetteLegacyHtml } from '@dmr.is/utils-server/cleanLegacyHtml'
import { getHtmlTextLength } from '@dmr.is/utils-server/serverUtils'

import { LegalGazetteModels } from '../core/constants'
import { StatusIdEnum } from '../core/enums/status.enum'
import { getAdvertHtmlMarkup } from '../core/html/advert-html'
// Type-only: `advert.dto.ts` imports this module back, and the DTOs are only
// ever mapper return types here - never constructed - so no runtime read is
// emitted and the two files stay acyclic at value level. See `models.md`.
import type {
  AdvertDetailedDto,
  AdvertDto,
  ExternalAdvertDto,
} from './advert.dto'
import {
  AdvertPublicationModel,
  AdvertPublicationsCreateAttributes,
  AdvertVersionEnum,
} from './advert-publication.model'
import { ApplicationModel } from './application.model'
import type { CaseModel as CaseModelRef } from './case.model'
import { CaseModel } from './case.model'
import type { CategoryModel as CategoryModelRef } from './category.model'
import { CategoryModel } from './category.model'
import { CommentModel, CommentTypeEnum } from './comment.model'
import {
  CommunicationChannelCreateAttributes,
  CommunicationChannelModel,
} from './communication-channel.model'
import type { CourtDistrictModel as CourtDistrictModelRef } from './court-district.model'
import { CourtDistrictModel } from './court-district.model'
import { FeeCodeModel } from './fee-code.model'
import type { ForeclosureModel as ForeclosureModelRef } from './foreclosure.model'
import { ForeclosureModel } from './foreclosure.model'
import { ForeclosurePropertyModel } from './foreclosure-property.model'
import type { SettlementModel as SettlementModelRef } from './settlement.model'
import { SettlementCreateAttributes, SettlementModel } from './settlement.model'
import type { SignatureModel as SignatureModelRef } from './signature.model'
import { SignatureCreationAttributes, SignatureModel } from './signature.model'
import type { StatusModel as StatusModelRef } from './status.model'
import { StatusModel } from './status.model'
import type { TBRTransactionModel as TBRTransactionModelRef } from './tbr-transactions.model'
import { TBRTransactionModel } from './tbr-transactions.model'
import type { TypeModel as TypeModelRef } from './type.model'
import { TypeIdEnum, TypeModel } from './type.model'
import type { UserModel as UserModelRef } from './users.model'
import { UserModel } from './users.model'

export enum AdvertTemplateType {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
  DIVISION_MEETING_BANKRUPTCY = 'DIVISION_MEETING_BANKRUPTCY',
  DIVISION_MEETING_DECEASED = 'DIVISION_MEETING_DECEASED',
  DIVISION_ENDING = 'DIVISION_ENDING',
  FORECLOSURE = 'FORECLOSURE',
  ADDITIONAL_ANNOUNCEMENT = 'ADDITIONAL_ANNOUNCEMENT',
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
  feeQuantity?: number

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
  feeQuantity?: number

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

@ParanoidTable({ tableName: LegalGazetteModels.ADVERT })
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
      { model: TypeModel, include: [{ model: FeeCodeModel }] },
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
export class AdvertModel extends ParanoidModel<
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

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  feeQuantity?: number | null

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
  case!: CaseModelRef

  @HasMany(() => CommunicationChannelModel)
  communicationChannels?: CommunicationChannelModel[]

  @BelongsTo(() => TypeModel)
  type!: TypeModelRef

  @BelongsTo(() => CategoryModel)
  category!: CategoryModelRef

  @BelongsTo(() => StatusModel)
  status!: StatusModelRef

  @BelongsTo(() => SettlementModel)
  settlement?: SettlementModelRef

  @BelongsTo(() => CourtDistrictModel)
  courtDistrict?: CourtDistrictModelRef

  @BelongsTo(() => UserModel)
  assignedUser?: UserModelRef

  @HasOne(() => SignatureModel)
  signature?: SignatureModelRef

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
  transaction?: TBRTransactionModelRef

  @HasMany(() => CommentModel)
  comments!: CommentModel[]

  @HasOne(() => ForeclosureModel)
  foreclosure?: ForeclosureModelRef

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
      const resolvedVersion =
        version ??
        this.publications
          .filter((pub) => pub.publishedAt !== null)
          .sort((a, b) => {
            if (!a.publishedAt || !b.publishedAt) return 0
            return b.publishedAt.getTime() - a.publishedAt.getTime()
          })[0]?.versionLetter

      return getAdvertHtmlMarkup(this, resolvedVersion)
    } catch (error) {
      const logger = getLogger('AdvertModel')
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error generating HTML markup,', { message })
      throw new InternalServerErrorException()
    }
  }

  get estimatedPrice(): number | null {
    const feeCode = this.type?.feeCode?.[0]
    if (!feeCode) return null

    const quantity = this.feeQuantity ?? 0
    if (quantity > 0) return feeCode.value * quantity
    if (!feeCode.isMultiplied) return feeCode.value

    try {
      const html = this.htmlMarkup(AdvertVersionEnum.A)
      if (!html) return null
      return feeCode.value * getHtmlTextLength(html)
    } catch {
      return null
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
      estimatedPrice: model.estimatedPrice ?? 0,
      totalPrice: model.transaction?.totalPrice ?? undefined,
      feeQuantity: model.feeQuantity ?? undefined,
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
