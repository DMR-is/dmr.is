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
import { LegacySubscriberModel } from './legacy-subscriber.model'

export type LegacyMigrationTokenAttributes = {
  id: string
  token: string
  email: string
  targetNationalId: string
  expiresAt: Date
  usedAt: Date | null
  legacySubscriberId: string
}

export type LegacyMigrationTokenCreateAttributes = {
  id?: string
  token: string
  email: string
  targetNationalId: string
  expiresAt: Date
  usedAt?: Date | null
  legacySubscriberId: string
}

@BaseTable({ tableName: LegalGazetteModels.LEGACY_MIGRATION_TOKEN })
@DefaultScope(() => ({
  attributes: [
    'id',
    'token',
    'email',
    'targetNationalId',
    'expiresAt',
    'usedAt',
    'legacySubscriberId',
  ],
}))
export class LegacyMigrationTokenModel extends BaseModel<
  LegacyMigrationTokenAttributes,
  LegacyMigrationTokenCreateAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  @ApiProperty({ type: String })
  token!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  email!: string

  @Column({
    type: DataType.TEXT,
    field: 'target_national_id',
    allowNull: false,
  })
  @ApiProperty({ type: String })
  targetNationalId!: string

  @Column({
    type: DataType.DATE,
    field: 'expires_at',
    allowNull: false,
  })
  @ApiProperty({ type: Date })
  expiresAt!: Date

  @Column({
    type: DataType.DATE,
    field: 'used_at',
    allowNull: true,
  })
  @ApiProperty({ type: Date, nullable: true })
  usedAt!: Date | null

  @ForeignKey(() => LegacySubscriberModel)
  @Column({
    type: DataType.UUID,
    field: 'legacy_subscriber_id',
    allowNull: false,
  })
  legacySubscriberId!: string

  @BelongsTo(() => LegacySubscriberModel)
  legacySubscriber?: LegacySubscriberModel

  /**
   * Check if the token is still valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.usedAt && new Date() < this.expiresAt
  }


}
