import { Column, DataType, HasMany } from 'sequelize-typescript'

import {
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'
import {
  ApplicationRequirementStatementEnum,
  CompanySchema,
  SettlementType,
} from '@dmr.is/legal-gazette-schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

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
  endingDate?: Date | null
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
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  endingDate!: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
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
      deadline: model.deadline,
      dateOfDeath: model.dateOfDeath,
      declaredClaims: model.declaredClaims,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}

export class SettlementCompanyDto {
  @ApiString({ maxLength: 255 })
  companyName!: string

  @ApiString({ maxLength: 255 })
  companyNationalId!: string
}

export class SettlementDto {
  @ApiUUID()
  id!: string

  @ApiEnum(SettlementType, {
    enumName: 'SettlementType',
  })
  type!: SettlementType

  @ApiString({ maxLength: 255 })
  liquidatorName!: string

  @ApiString({ maxLength: 255 })
  liquidatorLocation!: string

  @ApiOptionalString({ maxLength: 255, nullable: true })
  liquidatorRecallStatementLocation!: string | null

  @ApiEnum(ApplicationRequirementStatementEnum, {
    enumName: 'ApplicationRequirementStatementEnum',
  })
  liquidatorRecallStatementType!: ApplicationRequirementStatementEnum

  @ApiString({ maxLength: 255 })
  name!: string

  @ApiString({ maxLength: 10 })
  nationalId!: string

  @ApiString({ maxLength: 255 })
  address!: string

  @ApiOptionalDateTime({ nullable: true })
  deadline?: Date | null

  @ApiOptionalDateTime({ nullable: true })
  dateOfDeath?: Date | null

  @ApiOptionalNumber({ nullable: true })
  declaredClaims!: number | null
}
