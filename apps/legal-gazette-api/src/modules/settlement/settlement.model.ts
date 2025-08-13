import {
  Column,
  DataType,
  DefaultScope,
  HasMany,
  HasOne,
} from 'sequelize-typescript'
import { z } from 'zod'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { DivisionEndingAdvertModel } from '../advert/division/models/division-ending-advert.model'
import { DivisionMeetingAdvertModel } from '../advert/division/models/division-meeting-advert.model'
import { RecallAdvertModel } from '../advert/recall/recall-advert.model'
import { SettlementDto } from './dto/settlement.dto'
type SettlementAttributes = {
  liquidatorName: string
  liquidatorLocation: string
  liquidatorOnBehalfOf?: string

  settlementName: string
  settlementNationalId: string
  settlementAddress: string
  settlementDeadline: Date
  settlementDateOfDeath: Date | null
}

type SettlementCreationAttributes = SettlementAttributes

export const settlementSchema = z.object({
  liquidatorName: z.string(),
  liquidatorLocation: z.string(),
  liquidatorOnBehalfOf: z.string().optional(),
  settlementName: z.string(),
  settlementNationalId: z.string(),
  settlementAddress: z.string(),
  settlementDeadline: z.string().transform((iso) => new Date(iso)),
  settlementDateOfDeath: z
    .string()
    .transform((iso) => new Date(iso))
    .nullable(),
})

@DefaultScope(() => ({
  attributes: [
    'id',
    'liquidatorName',
    'liquidatorLocation',
    'liquidatorOnBehalfOf',
    'settlementName',
    'settlementNationalId',
    'settlementAddress',
    'settlementDeadline',
    'settlementDateOfDeath',
  ],
}))
@BaseTable({ tableName: LegalGazetteModels.SETTLEMENT })
export class SettlementModel extends BaseModel<
  SettlementAttributes,
  SettlementCreationAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'liquidator_name',
  })
  liquidatorName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'liquidator_location',
  })
  liquidatorLocation!: string

  @Column({
    type: DataType.TEXT,
    field: 'on_behalf_of_liquidator',
  })
  liquidatorOnBehalfOf?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_name',
  })
  settlementName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_national_id',
  })
  settlementNationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'settlement_address',
  })
  settlementAddress!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_deadline_date',
  })
  settlementDeadline!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'settlement_date_of_death',
  })
  settlementDateOfDeath!: Date | null

  @HasMany(() => RecallAdvertModel)
  recallAdverts!: RecallAdvertModel[]

  @HasMany(() => DivisionMeetingAdvertModel)
  divisionMeetingAdverts?: DivisionMeetingAdvertModel[]

  @HasOne(() => DivisionEndingAdvertModel)
  divisionEndingAdvert?: DivisionEndingAdvertModel

  static fromModel(model: SettlementModel): SettlementDto {
    return {
      liquidatorName: model.liquidatorName,
      liquidatorLocation: model.liquidatorLocation,
      liquidatorOnBehalfOf: model.liquidatorOnBehalfOf,
      settlementName: model.settlementName,
      settlementNationalId: model.settlementNationalId,
      settlementAddress: model.settlementAddress,
      settlementDeadline: model.settlementDeadline
        ? model.settlementDeadline.toISOString()
        : null,
      settlementDateOfDeath: model.settlementDateOfDeath
        ? model.settlementDateOfDeath.toISOString()
        : null,
    }
  }

  fromModel(): SettlementDto {
    return SettlementModel.fromModel(this)
  }
}
