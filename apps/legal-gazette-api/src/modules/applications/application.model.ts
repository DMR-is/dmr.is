import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { CommunicationChannelCreateAttributes } from '../communication-channel/communication-channel.model'
import { CourtDistrictModel } from '../court-district/court-district.model'
import { TypeEnum } from '../type/type.model'
import { ApplicationDetailedDto, ApplicationDto } from './dto/application.dto'
import { ApplicationStatusEnum } from './contants'

export enum ApplicationTypeEnum {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
}

export type ApplicationAttributes = {
  caseId: string
  submittedByNationalId: string
  status: ApplicationStatusEnum
  applicationType: ApplicationTypeEnum
  categoryId: string | null
  courtDistrictId: string | null
  islandIsApplicationId: string | null
  caption: string | null
  additionalText: string | null
  judgmentDate: Date | null
  html: string | null
  signatureName: string | null
  signatureOnBehalfOf: string | null
  signatureLocation: string | null
  signatureDate: Date | null
  settlementName: string | null
  settlementNationalId: string | null
  settlementAddress: string | null
  settlementDeadlineDate: Date | null
  settlementDateOfDeath: Date | null
  divisionMeetingDate: Date | null
  divisionMeetingLocation: string | null
  publishingDates: Date[]
  communicationChannels: CommunicationChannelCreateAttributes[]
}

export type ApplicationCreateAttributes = {
  caseId?: string
  applicationType: ApplicationTypeEnum
  submittedByNationalId: string
  categoryId?: string | null
  courtDistrictId?: string | null
  islandIsApplicationId?: string | null
  caption?: string | null
  additionalText?: string | null
  judgmentDate?: Date | null
  html?: string | null
  signatureName?: string | null
  signatureOnBehalfOf?: string | null
  signatureLocation?: string | null
  signatureDate?: Date | null
  settlementName?: string | null
  settlementNationalId?: string | null
  settlementAddress?: string | null
  settlementDeadlineDate?: Date | null
  settlementDateOfDeath?: Date | null
  divisionMeetingDate?: Date | null
  divisionMeetingLocation?: string | null
  publishingDates?: Date[]
  communicationChannels?: CommunicationChannelCreateAttributes[]
}

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
@DefaultScope(() => ({
  include: [{ model: CategoryModel, as: 'category' }],
}))
@Scopes(() => ({
  common: {
    attributes: [
      'id',
      'caseId',
      'submittedByNationalId',
      'applicationType',
      'status',
      'caption',
      'html',
      'signatureName',
      'signatureOnBehalfOf',
      'signatureLocation',
      'signatureDate',
      'publishingDates',
      'communicationChannels',
    ],
    include: [{ model: CategoryModel, as: 'category' }],
  },
  bankruptcy: {
    attributes: [
      'id',
      'caseId',
      'submittedByNationalId',
      'applicationType',
      'additionalText',
      'status',
      'judgmentDate',
      'settlementName',
      'settlementNationalId',
      'settlementAddress',
      'settlementDeadlineDate',
      'divisionMeetingDate',
      'divisionMeetingLocation',
      'publishingDates',
      'communicationChannels',
    ],
    include: [
      { model: CategoryModel, as: 'category' },
      { model: CourtDistrictModel, as: 'courtDistrict' },
    ],
  },
  deceased: {
    attributes: [
      'id',
      'caseId',
      'submittedByNationalId',
      'applicationType',
      'additionalText',
      'status',
      'judgmentDate',
      'settlementName',
      'settlementNationalId',
      'settlementAddress',
      'settlementDateOfDeath',
      'publishingDates',
      'communicationChannels',
    ],
    include: [
      { model: CategoryModel, as: 'category' },
      { model: CourtDistrictModel, as: 'courtDistrict' },
    ],
  },
}))
export class ApplicationModel extends BaseModel<
  ApplicationAttributes,
  ApplicationCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  submittedByNationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  applicationType!: ApplicationTypeEnum

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CategoryModel)
  categoryId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    defaultValue: ApplicationStatusEnum.DRAFT,
    allowNull: false,
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  islandIsApplicationId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  caption!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  additionalText!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  judgmentDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  html!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureOnBehalfOf!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureLocation!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  signatureDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  settlementName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  settlementNationalId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  settlementAddress!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  settlementDeadlineDate!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  settlementDateOfDeath!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  liquidatorName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  liquidatorLocation!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  liquidatorOnBehalfOf!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  divisionMeetingDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  divisionMeetingLocation!: string | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    allowNull: true,
    defaultValue: [],
  })
  publishingDates!: Date[]

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  communicationChannels!: CommunicationChannelCreateAttributes[]

  @BelongsTo(() => CategoryModel)
  category?: CategoryModel

  @BelongsTo(() => CourtDistrictModel)
  courtDistrict!: CourtDistrictModel

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  get title() {
    if (!this.category) {
      if (this.applicationType === ApplicationTypeEnum.COMMON) {
        return TypeEnum.COMMON_ADVERT
      }

      if (this.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
        return `${TypeEnum.RECALL} þrotabús`
      }

      if (this.applicationType === ApplicationTypeEnum.RECALL_DECEASED) {
        return `${TypeEnum.RECALL} dánarbús`
      }

      throw new Error('Category not loaded')
    }

    if (this.applicationType === ApplicationTypeEnum.COMMON) {
      return `${this.category.title} - ${this.caption ?? ''}`
    }

    return `${this.category.title} - ${this.settlementName ?? ''}`
  }

  static fromModel(model: ApplicationModel): ApplicationDto {
    return {
      id: model.id,
      caseId: model.caseId,
      nationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      category: model.category?.fromModel(),
      applicationType: model.applicationType,
    }
  }

  fromModel(): ApplicationDto {
    return ApplicationModel.fromModel(this)
  }

  static fromModelToDetailedDto(
    model: ApplicationModel,
  ): ApplicationDetailedDto {
    return {
      ...this.fromModel(model),
      courtDistrictId: model.courtDistrictId,
      islandIsApplicationId: model.islandIsApplicationId,
      caption: model.caption,
      additionalText: model.additionalText,
      judgmentDate: model.judgmentDate
        ? model.judgmentDate.toISOString()
        : null,
      html: model.html,
      signatureName: model.signatureName,
      signatureOnBehalfOf: model.signatureOnBehalfOf,
      signatureLocation: model.signatureLocation,
      signatureDate: model.signatureDate
        ? model.signatureDate.toISOString()
        : null,
      settlementName: model.settlementName,
      settlementNationalId: model.settlementNationalId,
      settlementAddress: model.settlementAddress,
      settlementDeadlineDate: model.settlementDeadlineDate
        ? model.settlementDeadlineDate.toISOString()
        : null,
      settlementDateOfDeath: model.settlementDateOfDeath
        ? model.settlementDateOfDeath.toISOString()
        : null,
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorOnBehalfOf: model.liquidatorOnBehalfOf,
      divisionMeetingDate: model.divisionMeetingDate
        ? model.divisionMeetingDate.toISOString()
        : null,
      divisionMeetingLocation: model.divisionMeetingLocation,
      publishingDates: model.publishingDates.map((date) => date.toISOString()),
      communicationChannels: model.communicationChannels.map((ch) => ({
        email: ch.email,
        name: ch.name ?? undefined,
        phone: ch.phone ?? undefined,
      })),
    }
  }

  fromModelToDetailedDto(): ApplicationDetailedDto {
    return ApplicationModel.fromModelToDetailedDto(this)
  }
}
