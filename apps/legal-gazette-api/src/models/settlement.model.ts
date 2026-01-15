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

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

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
  @ApiProperty({ enum: SettlementType, enumName: 'SettlementType' })
  type!: SettlementType

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  liquidatorName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  liquidatorLocation!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false })
  liquidatorRecallStatementLocation!: string | null

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
    allowNull: false,
    field: 'name',
  })
  @ApiProperty({ type: String })
  name!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'national_id',
  })
  @ApiProperty({ type: String })
  nationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'address',
  })
  @ApiProperty({ type: String })
  address!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'deadline_date',
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  deadline!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'date_of_death',
  })
  @ApiProperty({ type: String, required: false, nullable: true })
  dateOfDeath!: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: Number, required: false })
  declaredClaims!: number | null

  @Column({ type: DataType.JSONB })
  companies?: CompanySchema[]

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

export class SettlementDto extends PickType(SettlementModel, [
  'id',
  'type',
  'liquidatorName',
  'liquidatorLocation',
  'liquidatorRecallStatementLocation',
  'liquidatorRecallStatementType',
  'name',
  'nationalId',
  'address',
  'declaredClaims',
] as const) {
  @ApiProperty({ type: String, required: true, nullable: true })
  @ValidateIf((o) => o.deadline !== null)
  @IsDateString()
  deadline!: string | null
  @ApiProperty({ type: String, required: false, nullable: true })
  @ValidateIf((o) => o.dateOfDeath !== null)
  @IsDateString()
  dateOfDeath!: string | null
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
  recallStatementLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  recallStatementType?: string

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
}

export class UpdateSettlementDto extends PartialType(SettlementDto) {}
