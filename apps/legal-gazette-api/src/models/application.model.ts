import { Expose, Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBase64,
  isBase64,
  IsDateString,
  IsEnum,
  IsNumber,
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
  Scopes,
} from 'sequelize-typescript'

import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger'

import { CommunicationChannelSchema } from '@dmr.is/legal-gazette/schemas'
import { Paging } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import { CreateCommunicationChannelDto } from '../modules/communication-channel/dto/communication-channel.dto'
import { TypeDto } from '../modules/type/dto/type.dto'
import { CaseModel } from './case.model'
import { CategoryDto, CategoryModel } from './category.model'
import { CommunicationChannelCreateAttributes } from './communication-channel.model'
import { CourtDistrictModel } from './court-district.model'
import { TypeIdEnum, TypeModel } from './type.model'

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

export enum ApplicationTypeEnum {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
}

export enum IslandIsCommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export type ApplicationAttributes = {
  caseId: string
  submittedByNationalId: string
  status: ApplicationStatusEnum
  applicationType: ApplicationTypeEnum
  typeId: string | null
  categoryId?: string | null
  courtDistrictId?: string | null
  islandIsApplicationId?: string | null
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
  @ApiProperty({ type: String })
  caseId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  submittedByNationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationTypeEnum)),
    allowNull: false,
  })
  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  applicationType!: ApplicationTypeEnum

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => CategoryModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  categoryId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ForeignKey(() => TypeModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  typeId?: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatusEnum)),
    defaultValue: ApplicationStatusEnum.DRAFT,
    allowNull: false,
  })
  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
  })
  status!: ApplicationStatusEnum

  @Column({
    type: DataType.UUID,
    defaultValue: null,
    allowNull: true,
  })
  @ForeignKey(() => CourtDistrictModel)
  @ApiProperty({ type: String, required: false, nullable: true })
  courtDistrictId?: string | null

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  islandIsApplicationId?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  caption?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  additionalText?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  judgmentDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  html?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureName?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureOnBehalfOf?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureLocation?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  signatureDate?: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementName?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementNationalId?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementAddress?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementDeadlineDate!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  settlementDateOfDeath!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorName?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorLocation?: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorRecallStatementLocation?: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationRequirementStatementEnum)),
    defaultValue: ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
    allowNull: false,
  })
  @ApiProperty({
    enum: ApplicationRequirementStatementEnum,
    enumName: 'ApplicationRequirementStatementEnum',
  })
  liquidatorRecallStatementType!: ApplicationRequirementStatementEnum

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  liquidatorOnBehalfOf?: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingDate!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  divisionMeetingLocation?: string | null

  @Column({
    type: DataType.ARRAY(DataType.DATE),
    allowNull: true,
    defaultValue: [],
  })
  @ApiProperty({ type: [String], required: false, nullable: true })
  publishingDates!: Date[]

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  @ApiProperty({ type: Object, required: false, nullable: true })
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

class CommonApplicationAttributes {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  location?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  date?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  nationalId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  meetingDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  meetingLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string
}

export class ApplicationSignatureDto extends PickType(
  CommonApplicationAttributes,
  ['name', 'location', 'date'] as const,
) {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  onBehalfOf?: string
}

export class ApplicationSettlementDto extends PickType(
  CommonApplicationAttributes,
  ['name', 'nationalId', 'address'] as const,
) {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  deadlineDate?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateOfDeath?: string
}

export class UpdateApplicationSettlementDto extends PartialType(
  ApplicationSettlementDto,
) {}

export class ApplicationDivisionMeetingFieldsDto extends PickType(
  CommonApplicationAttributes,
  ['meetingDate', 'meetingLocation'] as const,
) {}

export class UpdateApplicationDivisionMeetingFieldsDto extends PartialType(
  ApplicationDivisionMeetingFieldsDto,
) {}

export class CourtAndJudgmentFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  courtDistrictId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  judgmentDate?: string
}

export class UpdateCourtAndJudgmentFieldsDto extends PartialType(
  CourtAndJudgmentFieldsDto,
) {}

export class ApplicationLiquidationFieldsDto extends PickType(
  CommonApplicationAttributes,
  ['name', 'location'] as const,
) {
  @ApiProperty({
    enum: ApplicationRequirementStatementEnum,
    enumName: 'ApplicationRequirementStatementEnum',
    default: ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
    required: false,
  })
  @IsEnum(ApplicationRequirementStatementEnum)
  @IsOptional()
  recallRequirementStatementType?: ApplicationRequirementStatementEnum

  @ApiProperty({
    type: String,
    required: false,
    description: 'Location to send recall requirement (Kröfulýsing)',
  })
  @IsOptional()
  @IsString()
  recallRequirementStatementLocation?: string
}

export class UpdateApplicationLiquidationFieldsDto extends PartialType(
  ApplicationLiquidationFieldsDto,
) {}

export class ApplicationPublishingDatesDto {
  @ApiProperty({ type: String })
  @IsDateString()
  publishingDate!: string
}

export class CommonApplicationFieldsDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  typeId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  caption?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!isBase64(value)) {
      return value
    }

    return Buffer.from(value, 'base64').toString('utf-8')
  })
  html?: string
}

export class RecallFieldsDto {
  @ApiProperty({ type: CourtAndJudgmentFieldsDto })
  courtAndJudgmentFields!: CourtAndJudgmentFieldsDto

  @ApiProperty({ type: ApplicationLiquidationFieldsDto })
  liquidatorFields!: ApplicationLiquidationFieldsDto

  @ApiProperty({ type: ApplicationSettlementDto })
  settlementFields!: ApplicationSettlementDto

  @ApiProperty({ type: ApplicationDivisionMeetingFieldsDto })
  divisionMeetingFields!: ApplicationDivisionMeetingFieldsDto
}

export class UpdateRecallFieldsDto {
  @ApiProperty({ type: UpdateCourtAndJudgmentFieldsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCourtAndJudgmentFieldsDto)
  courtAndJudgmentFields?: UpdateCourtAndJudgmentFieldsDto

  @ApiProperty({ type: UpdateApplicationLiquidationFieldsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationLiquidationFieldsDto)
  liquidatorFields?: UpdateApplicationLiquidationFieldsDto

  @ApiProperty({ type: UpdateApplicationSettlementDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationSettlementDto)
  settlementFields?: UpdateApplicationSettlementDto

  @ApiProperty({
    type: UpdateApplicationDivisionMeetingFieldsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicationDivisionMeetingFieldsDto)
  divisionMeetingFields?: UpdateApplicationDivisionMeetingFieldsDto
}

export class ApplicationDto extends PickType(ApplicationModel, [
  'id',
  'caseId',
  'islandIsApplicationId',
  'submittedByNationalId',
  'applicationType',
  'title',
  'status',
] as const) {
  @ApiProperty({ type: String })
  @IsDateString()
  createdAt!: string

  @ApiProperty({ type: String })
  @IsDateString()
  updatedAt!: string

  @ApiProperty({ type: CategoryDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryDto)
  category?: CategoryDto

  @ApiProperty({ type: TypeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDto)
  type?: TypeDto
}

export class ApplicationFieldsDto extends PickType(
  CommonApplicationAttributes,
  ['additionalText'] as const,
) {
  @ApiProperty({ type: CommonApplicationFieldsDto })
  commonFields!: CommonApplicationFieldsDto

  @ApiProperty({ type: RecallFieldsDto })
  recallFields!: RecallFieldsDto

  @ApiProperty({ type: ApplicationSignatureDto })
  signature!: ApplicationSignatureDto

  @ApiProperty({ type: [ApplicationPublishingDatesDto] })
  publishingDates!: ApplicationPublishingDatesDto[]

  @ApiProperty({ type: [CreateCommunicationChannelDto] })
  communicationChannels!: CreateCommunicationChannelDto[]
}

export class ApplicationDetailedDto extends IntersectionType(
  ApplicationDto,
  ApplicationFieldsDto,
) {}

export class UpdateApplicationDto extends PickType(
  CommonApplicationAttributes,
  ['additionalText'] as const,
) {
  @ApiProperty({ type: CommonApplicationFieldsDto, required: false })
  @IsOptional()
  @Type(() => CommonApplicationFieldsDto)
  @ValidateNested()
  commonFields?: CommonApplicationFieldsDto

  @ApiProperty({ type: UpdateRecallFieldsDto, required: false })
  @IsOptional()
  @Type(() => UpdateRecallFieldsDto)
  @ValidateNested()
  recallFields?: UpdateRecallFieldsDto

  @ApiProperty({ type: ApplicationSignatureDto, required: false })
  @IsOptional()
  @Type(() => ApplicationSignatureDto)
  @ValidateNested()
  signature?: ApplicationSignatureDto

  @ApiProperty({ type: [ApplicationPublishingDatesDto], required: false })
  @IsOptional()
  @Type(() => ApplicationPublishingDatesDto)
  @ValidateNested({ each: true })
  publishingDates?: ApplicationPublishingDatesDto[]

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @Type(() => CreateCommunicationChannelDto)
  @ValidateNested({ each: true })
  communicationChannels?: CreateCommunicationChannelDto[]
}

export class GetApplicationsDto {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class AddDivisionMeetingForApplicationDto extends PickType(
  CommonApplicationAttributes,
  ['additionalText'] as const,
) {
  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string

  @ApiProperty({ type: ApplicationSignatureDto })
  @ValidateNested()
  @Type(() => ApplicationSignatureDto)
  signature!: ApplicationSignatureDto

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  communicationChannels?: CreateCommunicationChannelDto[]
}

export class AddDivisionEndingForApplicationDto extends OmitType(
  AddDivisionMeetingForApplicationDto,
  ['meetingDate', 'meetingLocation'],
) {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  declaredClaims!: number
}

export class IslandIsSubmitCommonApplicationDto extends PickType(
  CommonApplicationAttributes,
  ['additionalText'] as const,
) {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  islandIsApplicationId!: string

  @ApiProperty({ type: String })
  @IsBase64()
  htmlBase64!: string

  @Expose()
  @IsString()
  @Transform(({ obj }) =>
    Buffer.from(obj.htmlBase64, 'base64').toString('utf-8'),
  )
  html!: string

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  typeId!: string

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  caption!: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: true })
  @IsArray()
  @Type(() => CreateCommunicationChannelDto)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  communicationChannels!: CreateCommunicationChannelDto[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsDateString({}, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  publishingDates!: string[]

  @ApiProperty({ type: ApplicationSignatureDto, required: true })
  @ValidateNested()
  @Type(() => ApplicationSignatureDto)
  signature!: ApplicationSignatureDto
}

export class IslandIsCommonApplicationUpdateStateEventDto {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    enum: IslandIsCommonApplicationEventsEnum,
    enumName: 'CommonApplicationEvents',
  })
  event!: IslandIsCommonApplicationEventsEnum
}
