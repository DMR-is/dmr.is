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
} from 'sequelize-typescript'
import { isBase64 } from 'validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import {
  ApplicationTypeEnum,
  CommonApplicationAnswers,
  RecallBankruptcyApplicationAnswers,
  RecallDeceasedApplicationAnswers,
} from '@dmr.is/legal-gazette/schemas'
import { Paging } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../core/dto/detailed.dto'
import { CaseModel } from './case.model'
import { CreateCommunicationChannelDto } from './communication-channel.model'
import { SettlementModel } from './settlement.model'
import { CreateSignatureDto } from './signature.model'

export enum ApplicationStatusEnum {
  DRAFT = 'DRAFT',
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
  submittedByNationalId: string
  applicationType: ApplicationTypeEnum
  status: ApplicationStatusEnum
  answers: ApplicationAnswers
}

export type ApplicationAttributes = BaseApplicationAttributes &
  ApplicationAnswers

export type ApplicationCreateAttributes = {
  caseId?: string
  settlementId?: string | null
  submittedByNationalId: string
  applicationType: ApplicationTypeEnum
  status?: ApplicationStatusEnum
  answers?: ApplicationAnswers
}

@BaseTable({ tableName: LegalGazetteModels.APPLICATION })
@DefaultScope(() => ({
  include: [{ model: SettlementModel, as: 'settlement' }],
  order: [['createdAt', 'DESC']],
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
  submittedByNationalId!: string

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
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  answers!: ApplicationAnswers

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => SettlementModel)
  settlement?: SettlementModel

  get title() {
    if (this.applicationType === ApplicationTypeEnum.RECALL_DECEASED) {
      return 'Innköllun dánarbús'
    }

    if (this.applicationType === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
      return 'Innköllun þrotabús'
    }

    return 'Almenn umsókn'
  }

  static fromModel(model: ApplicationModel): ApplicationDto {
    return {
      id: model.id,
      deletedAt: model.deletedAt?.toISOString(),
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      caseId: model.caseId,
      submittedByNationalId: model.submittedByNationalId,
      status: model.status,
      title: model.title,
      type: model.applicationType,
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
  submittedByNationalId!: string

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
  })
  status!: ApplicationStatusEnum

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  type!: ApplicationTypeEnum
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

  @ApiProperty({ type: [CreateCommunicationChannelDto] })
  @IsOptional()
  @Type(() => CreateCommunicationChannelDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  communicationChannels!: CreateCommunicationChannelDto[]
}

export class CreateDivisionEndingDto extends CreateDivisionMeetingDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  declaredClaims!: number
}

export class IslandIsSubmitApplicationDto extends PickType(
  CreateDivisionMeetingDto,
  ['signature', 'communicationChannels', 'additionalText'] as const,
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
