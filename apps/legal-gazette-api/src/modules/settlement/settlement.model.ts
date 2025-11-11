import { Column, DataType, HasMany } from 'sequelize-typescript'

import { ApplicationRequirementStatementEnum } from '@dmr.is/legal-gazette/schemas'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { AdvertModel } from '../advert/advert.model'
import { SettlementDto } from './dto/settlement.dto'
type SettlementAttributes = {
  advertId: string
  liquidatorName: string
  liquidatorLocation: string
  settlementName: string
  settlementNationalId: string
  settlementAddress: string
  settlementDeadline: Date | null
  settlementDateOfDeath: Date | null
  settlementDeclaredClaims: number | null
  liquidatorRecallStatementLocation?: string | null
  liquidatorRecallStatementType?: string | null
}

export type SettlementCreateAttributes = Omit<
  SettlementAttributes,
  'advertId' | 'settlementDeclaredClaims'
> & {
  advertId?: string
  settlementDeclaredClaims?: number | null
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
  settlementName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'national_id',
  })
  settlementNationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'address',
  })
  settlementAddress!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'deadline_date',
  })
  settlementDeadline!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'date_of_death',
  })
  settlementDateOfDeath!: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  declaredClaims!: number | null

  @HasMany(() => AdvertModel)
  adverts!: AdvertModel[]

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      id: model.id,
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorRecallStatementLocation:
        model.liquidatorRecallStatementLocation ?? undefined,
      liquidatorRecallStatementType: model.liquidatorRecallStatementType,
      settlementName: model.settlementName,
      settlementNationalId: model.settlementNationalId,
      settlementAddress: model.settlementAddress,
      settlementDeadline: model.settlementDeadline
        ? model.settlementDeadline.toISOString()
        : null,
      settlementDateOfDeath: model.settlementDateOfDeath
        ? model.settlementDateOfDeath.toISOString()
        : null,
      declaredClaims: model.declaredClaims,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}
