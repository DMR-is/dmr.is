import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
} from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { SubscriberModel } from './subscriber.model'

export type LegacySubscriberAttributes = {
  id: string
  name: string
  email: string
  nationalId: string | null
  isActive: boolean
  passwordHash: string | null
  migratedAt: Date | null
  migratedToSubscriberId: string | null
}

export type LegacySubscriberCreateAttributes = {
  id?: string
  name: string
  email: string
  nationalId?: string | null
  isActive?: boolean
  passwordHash?: string | null
  migratedAt?: Date | null
  migratedToSubscriberId?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.LEGACY_SUBSCRIBER })
@DefaultScope(() => ({
  attributes: [
    'id',
    'name',
    'email',
    'nationalId',
    'isActive',
    'migratedAt',
    'migratedToSubscriberId',
  ],
}))
export class LegacySubscriberModel extends BaseModel<
  LegacySubscriberAttributes,
  LegacySubscriberCreateAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  name!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  @ApiProperty({ type: String })
  email!: string

  @Column({
    type: DataType.TEXT,
    field: 'national_id',
    allowNull: true,
  })
  @ApiProperty({ type: String, nullable: true })
  nationalId!: string | null

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: false,
  })
  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @Column({
    type: DataType.TEXT,
    field: 'password_hash',
    allowNull: true,
  })
  passwordHash!: string | null

  @Column({
    type: DataType.DATE,
    field: 'migrated_at',
    allowNull: true,
  })
  @ApiProperty({ type: Date, nullable: true })
  migratedAt!: Date | null

  @ForeignKey(() => SubscriberModel)
  @Column({
    type: DataType.UUID,
    field: 'migrated_to_subscriber_id',
    allowNull: true,
  })
  migratedToSubscriberId!: string | null

  @BelongsTo(() => SubscriberModel)
  migratedToSubscriber?: SubscriberModel
}
