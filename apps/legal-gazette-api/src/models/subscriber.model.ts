import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
} from 'class-validator'
import { Column, DataType, DefaultScope, HasMany } from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { ApiDateTime, ApiString } from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { SubscriberTransactionModel } from './subscriber-transaction.model'

export type SubscriberAttributes = {
  id: string
  nationalId: string
  name: string | null
  email: string | null
  isActive: boolean
  subscribedFrom: Date | null
  subscribedTo: Date | null
}

export type SubscriberCreateAttributes = {
  id?: string
  nationalId: string
  name?: string | null
  email?: string | null
  isActive?: boolean
  subscribedFrom?: Date | null
  subscribedTo?: Date | null
}

@BaseTable({ tableName: LegalGazetteModels.SUBSCRIBER })
@DefaultScope(() => ({
  attributes: [
    'id',
    'nationalId',
    'name',
    'email',
    'isActive',
    'subscribedFrom',
    'subscribedTo',
  ],
}))
export class SubscriberModel extends BaseModel<
  SubscriberAttributes,
  SubscriberCreateAttributes
> {
  @Column({
    type: DataType.TEXT,
    field: 'national_id',
    allowNull: false,
    unique: true,
  })
  @ApiProperty({ type: String })
  nationalId!: string

  @Column({
    type: DataType.TEXT,
    field: 'name',
    allowNull: true,
  })
  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @Column({
    type: DataType.TEXT,
    field: 'email',
    allowNull: true,
  })
  @ApiProperty({ type: String, nullable: true })
  email!: string | null

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: false,
  })
  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @Column({
    type: DataType.DATE,
    field: 'subscribed_from',
    allowNull: true,
  })
  @ApiProperty({ type: Date, nullable: true })
  subscribedFrom!: Date | null

  @Column({
    type: DataType.DATE,
    field: 'subscribed_to',
    allowNull: true,
  })
  @ApiProperty({
    type: Date,
    nullable: true,
  })
  subscribedTo!: Date | null

  @HasMany(() => SubscriberTransactionModel)
  transactions?: SubscriberTransactionModel[]

  static fromModel(model: SubscriberModel): SubscriberDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      name: model.name,
      email: model.email,
      isActive: model.isActive,
      subscribedFrom: model.subscribedFrom,
      subscribedTo: model.subscribedTo,
    }
  }

  fromModel() {
    return SubscriberModel.fromModel(this)
  }
}

export class SubscriberDto extends PickType(SubscriberModel, [
  'id',
  'nationalId',
  'name',
  'email',
  'isActive',
  'subscribedFrom',
  'subscribedTo',
]) {}
