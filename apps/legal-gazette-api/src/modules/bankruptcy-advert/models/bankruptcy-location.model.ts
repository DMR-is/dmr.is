import { DataTypes } from 'sequelize'
import {
  BelongsTo,
  Column,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { BankruptcyLocationDto } from '../dto/bankruptcy-location.dto'
import { BankruptcyAdvertModel } from './bankruptcy-advert.model'

type BankruptcyLocationAttributes = {
  name: string
  nationalId: string
  address: string
  deadline: Date
  bankruptcyAdvertId: string
}

export type BankruptcyLocationCreationAttributes = {
  name: string
  nationalId: string
  address: string
  deadline: Date
  bankruptcyAdvertId?: string
}

@DefaultScope(() => ({
  attributes: ['id', 'name', 'nationalId', 'address', 'deadline'],
  order: [['deadline', 'ASC']],
}))
@BaseTable({ tableName: LegalGazetteModels.BANKRUPTCY_LOCATION })
export class BankruptcyLocationModel extends BaseModel<
  BankruptcyLocationAttributes,
  BankruptcyLocationCreationAttributes
> {
  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'name',
  })
  name!: string

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'national_id',
  })
  nationalId!: string

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'address',
  })
  address!: string

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    field: 'deadline_date',
  })
  deadline!: Date

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    field: 'bankruptcy_advert_id',
  })
  @ForeignKey(() => BankruptcyAdvertModel)
  bankruptcyAdvertId!: string

  @BelongsTo(() => BankruptcyAdvertModel)
  bankruptcyAdvert!: BankruptcyAdvertModel

  static fromModel(model: BankruptcyLocationModel): BankruptcyLocationDto {
    return {
      name: model.name,
      nationalId: model.nationalId,
      address: model.address,
      deadline: model.deadline.toISOString(),
    }
  }

  fromModel(): BankruptcyLocationDto {
    return BankruptcyLocationModel.fromModel(this)
  }
}
