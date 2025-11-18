import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator'
import { Column, DataType, HasMany } from 'sequelize-typescript'

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { ApplicationRequirementStatementEnum } from '@dmr.is/legal-gazette/schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertModel } from './advert.model'
type SettlementAttributes = {
  advertId: string
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
}

export type SettlementCreateAttributes = Omit<
  SettlementAttributes,
  'advertId' | 'declaredClaims'
> & {
  advertId?: string
  declaredClaims?: number | null
}

@BaseTable({ tableName: LegalGazetteModels.SETTLEMENT })
export class SettlementModel extends BaseModel<
  SettlementAttributes,
  SettlementCreateAttributes
> {
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
  @ApiProperty({ type: Number, required: false })
  declaredClaims!: number | null

  @HasMany(() => AdvertModel)
  adverts!: AdvertModel[]

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      id: model.id,
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

export class SettlementDto extends PickType(SettlementModel, [
  'id',
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
  @ValidateIf((o) => o.settlementDeadline !== null)
  @IsDateString()
  deadline!: string | null
  @ApiProperty({ type: String, required: false, nullable: true })
  @ValidateIf((o) => o.settlementDateOfDeath !== null)
  @IsDateString()
  dateOfDeath!: string | null
}

export class CreateSettlementDto {
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
  liquidatorRecallStatementLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  liquidatorRecallStatementType?: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementName!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementNationalId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  @MaxLength(255)
  settlementAddress!: string

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  declaredClaims?: number

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  settlementDeadline?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  settlementDateOfDeath?: string
}

export class UpdateSettlementDto extends PartialType(SettlementDto) {}
