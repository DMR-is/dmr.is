import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsDefined,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  Scopes,
} from 'sequelize-typescript'
import { isBase64 } from 'validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiDto,
  ApiHTML,
  ApiOptionalNumber,
  ApiOptionalString,
} from '@dmr.is/decorators'
import {
  ApplicationTypeEnum,
  CommonApplicationAnswers,
  RecallBankruptcyApplicationAnswers,
  RecallDeceasedApplicationAnswers,
} from '@dmr.is/legal-gazette-schemas'
import { Paging } from '@dmr.is/shared-dto'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'
import { get } from '@dmr.is/utils/shared/lodash/get'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
import { AdvertDto, AdvertModel } from './advert.model'
import { AdvertPublicationModel } from './advert-publication.model'
import { CaseModel } from './case.model'
import { SettlementModel } from './settlement.model'
import { CreateSignatureDto } from './signature.model'

export enum ApplicationStatusEnum {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  FINISHED = 'FINISHED',
}

export enum ApplicationRequirementStatementEnum {
  LIQUIDATORLOCATION = 'LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATORLOCATION = 'CUSTOM_LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATOREMAIL = 'CUSTOM_LIQUIDATOR_EMAIL',
}
export enum IslandIsCommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export type ApplicationAnswers<
  T extends ApplicationTypeEnum = ApplicationTypeEnum,
> = {
  [ApplicationTypeEnum.COMMON]: CommonApplicationAnswers
  [ApplicationTypeEnum.RECALL_BANKRUPTCY]: RecallBankruptcyApplicationAnswers
  [ApplicationTypeEnum.RECALL_DECEASED]: RecallDeceasedApplicationAnswers
}[T]

type BaseApplicationAttributes = {
  caseId: string
  settlementId: string | null
  applicantNationalId: string
  submittedByNationalId: string | null
  applicationType: ApplicationTypeEnum
  status: ApplicationStatusEnum
  answers: ApplicationAnswers
  adverts?: AdvertModel[]
  currentStep: number
}

export type ApplicationAttributes = BaseApplicationAttributes &
  ApplicationAnswers

export type ApplicationCreateAttributes = {
  caseId?: string
  settlementId?: string | null
  submittedByNationalId?: string | null
  applicantNationalId: string
  applicationType: ApplicationTypeEnum
  status?: ApplicationStatusEnum
  answers?: ApplicationAnswers
}

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
@DefaultScope(() => ({
  include: [{ model: SettlementModel, as: 'settlement' }],
  order: [['updatedAt', 'DESC']],
}))
@Scopes(() => ({
  listview: {
    include: [
      { model: SettlementModel, as: 'settlement' },
      {
        model: AdvertModel.scope('simpleview'),
        as: 'adverts',
        required: false,
        separate: true,
        include: [
          {
            model: AdvertPublicationModel,
            as: 'publications',
          },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
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
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => SettlementModel)
  settlementId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  applicantNationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  submittedByNationalId!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  applicationType!: ApplicationTypeEnum

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    allowNull: false,
    defaultValue: ApplicationStatusEnum.DRAFT,
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  currentStep!: number

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  answers!: ApplicationAnswers

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => SettlementModel)
  settlement?: SettlementModel

  @HasMany(() => AdvertModel)
  adverts?: AdvertModel[]

  get title() {
    if (this.applicationType === ApplicationTypeEnum.RECALL_DECEASED) {
      return 'Dánarbú'
    }

    if (this.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
      return 'Þrotabú'
    }

    const type = get(this.answers, 'fields.type.title', '')

    return `${type || 'Almenn auglýsing'}`
  }
  get subtitle() {
    if (
      this.applicationType === ApplicationTypeEnum.RECALL_DECEASED ||
      this.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY
    ) {
      return get(this.answers, 'fields.settlementFields.name', '')
    }

    return get(this.answers, 'fields.caption', '')
  }

  get previewTitle() {
    if (this.applicationType === ApplicationTypeEnum.RECALL_DECEASED) {
      return (
        'Innköllun dánarbús - ' +
        get(this.answers, 'fields.settlementFields.name', '')
      )
    }
    if (this.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
      return (
        'Innköllun þrotabús - ' +
        get(this.answers, 'fields.settlementFields.name', '')
      )
    }

    return get(this.answers, 'fields.caption', '')
  }

  static fromModel(model: ApplicationModel): ApplicationDto {
    return {
      id: model.id,
      deletedAt: model.deletedAt?.toISOString(),
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      applicantNationalId: model.applicantNationalId,
      submittedByNationalId: model.submittedByNationalId || undefined,
      status: model.status,
      title: model.title,
      type: model.applicationType,
      subtitle: model.subtitle,
      adverts:
        model.adverts?.flatMap((advert) => advert.fromModelToSimple()) || [],
      currentStep: model.currentStep,
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
      answers: { ...model.answers },
    }
  }

  fromModelToDetailedDto() {
    return ApplicationModel.fromModelToDetailedDto(this)
  }
}

export class ApplicationDto extends DetailedDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  caseId!: string

  @ApiProperty({ type: String })
  applicantNationalId!: string

  @ApiProperty({ type: String, required: false })
  submittedByNationalId?: string

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
  })
  status!: ApplicationStatusEnum

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String, required: false })
  subtitle?: string

  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  type!: ApplicationTypeEnum

  @ApiProperty({ type: () => [AdvertDto], required: false })
  adverts?: AdvertDto[]

  @ApiProperty({ type: Number })
  currentStep!: number
}

export class ApplicationDtoWithSubtitle extends ApplicationDto {
  subtitle?: string
}

export class GetApplicationsDto {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class ApplicationDetailedDto extends ApplicationDto {
  @ApiProperty({ type: Object, default: {} })
  answers!: Record<string, any>
}

export class UpdateApplicationDto {
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  currentStep?: number

  @ApiProperty({ type: Object, default: {} })
  @IsOptional()
  @IsObject()
  answers?: Record<string, any>
}

export class CreateDivisionMeetingDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string

  @ApiProperty({ type: CreateSignatureDto })
  @IsDefined()
  @Type(() => CreateSignatureDto)
  @ValidateNested()
  signature!: CreateSignatureDto
}

export class CreateDivisionEndingDto {
  @ApiOptionalString()
  additionalText?: string

  @ApiHTML({ required: false })
  @IsOptional()
  content?: string

  @ApiDateTime()
  scheduledAt!: Date

  @ApiDateTime()
  endingDate!: Date

  @ApiOptionalNumber()
  declaredClaims?: number

  @ApiDto(CreateSignatureDto)
  signature!: CreateSignatureDto
}

export class IslandIsSubmitApplicationDto extends PickType(
  CreateDivisionMeetingDto,
  ['signature', 'additionalText'] as const,
) {
  @ApiProperty({ type: String })
  @IsUUID()
  islandIsApplicationId!: string

  @ApiProperty({ type: String })
  @IsUUID()
  typeId!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: String })
  @IsString()
  caption!: string

  @ApiProperty({ type: String })
  @IsString()
  @Transform(({ value }) => {
    if (isBase64(value)) {
      return Buffer.from(value, 'base64').toString('utf-8')
    }
    return value
  })
  html!: string

  @ApiProperty({ type: [String] })
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsDateString(undefined, { each: true })
  publishingDates!: string[]
}

export class GetHTMLPreview {
  @ApiProperty({ type: String })
  preview!: string
}

export class GetMinDateResponseDto {
  @ApiProperty({ type: String })
  @IsDateString()
  minDate!: string
}

export class GetApplicationEstimatedPriceDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  price!: number
}
