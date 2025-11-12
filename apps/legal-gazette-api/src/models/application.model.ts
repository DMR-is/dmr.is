import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { CommunicationChannelSchema } from '@dmr.is/legal-gazette/schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import {
  ApplicationRequirementStatementEnum,
  ApplicationStatusEnum,
} from '../modules/applications/contants'
import {
  ApplicationDetailedDto,
  ApplicationDto,
} from '../modules/applications/dto/application.dto'
import { CaseModel } from './case.model'
import { CategoryModel } from './category.model'
import { CommunicationChannelCreateAttributes } from './communication-channel.model'
import { CourtDistrictModel } from './court-district.model'
import { TypeIdEnum, TypeModel } from './type.model'

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
  typeId: string | null
  categoryId: string | null
  courtDistrictId: string | null
  islandIsApplicationId: string | null
  caption: string | null
  additionalText: string | null
  judgmentDate: Date | null
  html: string | null
  liquidatorName: string | null
  liquidatorLocation: string | null
  liquidatorOnBehalfOf: string | null
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
  liquidatorRecallStatementLocation?: string | null
  liquidatorRecallStatementType?: ApplicationRequirementStatementEnum | null
}

export type ApplicationCreateAttributes = {
  caseId?: string
  applicationType: ApplicationTypeEnum
  submittedByNationalId: string
  categoryId?: string | null
  courtDistrictId?: string | null
  islandIsApplicationId?: string | null
  typeId?: string | null
  caption?: string | null
  additionalText?: string | null
  judgmentDate?: Date | null
  html?: string | null
  liquidatorName?: string | null
  liquidatorLocation?: string | null
  liquidatorOnBehalfOf?: string | null
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
  liquidatorRecallStatementLocation?: string | null
  liquidatorRecallStatementType?: ApplicationRequirementStatementEnum | null
}

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
@DefaultScope(() => ({
  include: [
    { model: CategoryModel, as: 'category' },
    { model: TypeModel, as: 'type' },
  ],
  order: [['createdAt', 'DESC']],
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
    include: [
      { model: CategoryModel, as: 'category' },
      { model: TypeModel, as: 'type' },
    ],
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
      { model: TypeModel, as: 'type' },
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
      { model: TypeModel, as: 'type' },
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
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => TypeModel)
  typeId!: string | null

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
  signatureName?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureOnBehalfOf?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  signatureLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  signatureDate?: Date | null

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
  liquidatorRecallStatementLocation!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationRequirementStatementEnum)),
    defaultValue: ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
    allowNull: false,
  })
  liquidatorRecallStatementType!: ApplicationRequirementStatementEnum

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
  communicationChannels!: CommunicationChannelSchema[]

  @BelongsTo(() => CategoryModel)
  category?: CategoryModel

  @BelongsTo(() => TypeModel)
  type?: TypeModel | null

  @BelongsTo(() => CourtDistrictModel)
  courtDistrict!: CourtDistrictModel

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  get title() {
    if (this.typeId === TypeIdEnum.DIVISION_MEETING) {
      return `Skipta/veðhafafundur`
    }

    switch (this.applicationType) {
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
        if (this.settlementName !== null) {
          return `Innköllun þrotabús - ${this.settlementName}`
        }
        return `Innköllun þrotabús`
      case ApplicationTypeEnum.RECALL_DECEASED:
        if (this.settlementName !== null) {
          return `Innköllun dánarbús - ${this.settlementName}`
        }
        return `Innköllun dánarbús`
      default:
        if (this.caption) {
          return `Almenn umsókn - ${this.caption}`
        }
        return `Almenn umsókn`
    }
  }

  static fromModel(model: ApplicationModel): ApplicationDto {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      submittedByNationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      type: model.type?.fromModel(),
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
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      submittedByNationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      type: model.type?.fromModel(),
      category: model.category?.fromModel(),
      applicationType: model.applicationType,
      additionalText: model.additionalText ?? undefined,
      commonFields: {
        caption: model.caption ?? undefined,
        typeId: model.typeId ?? undefined,
        categoryId: model.categoryId ?? undefined,
        html: model.html ?? undefined,
      },
      recallFields: {
        liquidatorFields: {
          name: model.liquidatorName ?? undefined,
          location: model.liquidatorLocation ?? undefined,
          recallRequirementStatementLocation:
            model.liquidatorRecallStatementLocation ?? undefined,
          recallRequirementStatementType:
            model.liquidatorRecallStatementType ?? undefined,
        },
        courtAndJudgmentFields: {
          courtDistrictId: model.courtDistrictId ?? undefined,
          judgmentDate: model.judgmentDate
            ? model.judgmentDate.toISOString()
            : undefined,
        },
        divisionMeetingFields: {
          meetingDate: model.divisionMeetingDate
            ? model.divisionMeetingDate.toISOString()
            : undefined,
          meetingLocation: model.divisionMeetingLocation ?? undefined,
        },
        settlementFields: {
          name: model.settlementName ?? undefined,
          nationalId: model.settlementNationalId ?? undefined,
          address: model.settlementAddress ?? undefined,
          deadlineDate: model.settlementDeadlineDate
            ? model.settlementDeadlineDate.toISOString()
            : undefined,
          dateOfDeath: model.settlementDateOfDeath
            ? model.settlementDateOfDeath.toISOString()
            : undefined,
        },
      },
      signature: {
        name: model.signatureName ?? undefined,
        onBehalfOf: model.signatureOnBehalfOf ?? undefined,
        location: model.signatureLocation ?? undefined,
        date: model.signatureDate?.toISOString(),
      },
      publishingDates: model.publishingDates.map((date) => ({
        publishingDate: date.toISOString(),
      })),
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
