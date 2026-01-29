import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator'
import { Column, DataType, HasMany } from 'sequelize-typescript'

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'

import {
  ApplicationRequirementStatementEnum,
  CompanySchema,
  SettlementType,
} from '@dmr.is/legal-gazette/schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertModel } from './advert.model'
type SettlementAttributes = {
  advertId: string
  type: SettlementType
  liquidatorName: string
  liquidatorLocation: string
  name: string
  nationalId: string
  address: string
  deadline: Date | null
  dateOfDeath: Date | null
  declaredClaims: number | null
  liquidatorRecallStatementLocation?: string | null
  liquidatorRecallStatementType?: string | null
  companies?: CompanySchema[]
  partnerNationalId?: string | null
  partnerName?: string | null
}

export type SettlementCreateAttributes = Omit<
  SettlementAttributes,
  'advertId' | 'declaredClaims' | 'type'
> & {
  advertId?: string
  declaredClaims?: number | null
  type?: SettlementType
}

@BaseTable({ tableName: LegalGazetteModels.SETTLEMENT })
export class SettlementModel extends BaseModel<
  SettlementAttributes,
  SettlementCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(SettlementType)),
    allowNull: false,
    defaultValue: SettlementType.DEFAULT,
  })
  type!: SettlementType

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  liquidatorName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  liquidatorLocation!: string

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
    allowNull: false,
    field: 'name',
  })
  name!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'national_id',
  })
  nationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'address',
  })
  address!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'deadline_date',
  })
  deadline!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'date_of_death',
  })
  dateOfDeath!: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  declaredClaims!: number | null

  @Column({ type: DataType.JSONB })
  companies?: CompanySchema[]

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  partnerNationalId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  partnerName!: string | null

  @HasMany(() => AdvertModel)
  adverts!: AdvertModel[]

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      id: model.id,
      type: model.type,
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorRecallStatementLocation:
        model.liquidatorRecallStatementLocation,
      liquidatorRecallStatementType: model.liquidatorRecallStatementType,
      name: model.name,
      nationalId: model.nationalId,
      address: model.address,
      deadline: model.deadline ? model.deadline.toISOString() : null,
      dateOfDeath: model.dateOfDeath ? model.dateOfDeath.toISOString() : null,
      declaredClaims: model.declaredClaims,
      partnerNationalId: model.partnerNationalId,
      partnerName: model.partnerName,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}

export class SettlementCompanyDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  companyName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  companyNationalId!: string
}

export class SettlementDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  id!: string

  @ApiProperty({
    enum: SettlementType,
    enumName: 'SettlementType',
    required: true,
  })
  @IsEnum(SettlementType)
  type!: SettlementType

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  liquidatorRecallStatementLocation!: string | null

  @ApiProperty({
    enum: ApplicationRequirementStatementEnum,
    enumName: 'ApplicationRequirementStatementEnum',
    required: true,
  })
  @IsEnum(ApplicationRequirementStatementEnum)
  liquidatorRecallStatementType!: ApplicationRequirementStatementEnum

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  name!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  nationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  address!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @ValidateIf((o) => o.deadline !== null)
  @IsDateString()
  deadline!: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @ValidateIf((o) => o.dateOfDeath !== null)
  @IsDateString()
  dateOfDeath!: string | null

  @ApiProperty({ type: Number, required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  declaredClaims!: number | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  partnerNationalId!: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  partnerName!: string | null
}

export class CreateSettlementDto {
  @ApiProperty({ enum: SettlementType, required: false })
  @IsOptional()
  @IsEnum(SettlementType)
  settlementType?: SettlementType

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  liquidatorLocation!: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  recallRequirementStatementLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  recallRequirementStatementType?: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  name!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  nationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  address!: string

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  declaredClaims?: number

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  deadline?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateOfDeath?: string

  @ApiProperty({ type: [SettlementCompanyDto], required: false })
  @IsOptional()
  companies?: SettlementCompanyDto[]

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  partnerNationalId?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  partnerName?: string
}

export class UpdateSettlementDto extends OmitType(PartialType(SettlementDto), [
  'id',
] as const) {}
