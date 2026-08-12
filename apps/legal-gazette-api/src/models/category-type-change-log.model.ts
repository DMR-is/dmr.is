import { Column, DataType, Model } from 'sequelize-typescript'

import { ApiPropertyOptional } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiEnum,
  ApiNumber,
  ApiOptionalArray,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { ParanoidTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'

export enum ChangeLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ATTACH = 'ATTACH',
  DETACH = 'DETACH',
  SET_ACTIVE = 'SET_ACTIVE',
  MOVE = 'MOVE',
  REVERT = 'REVERT',
}

export enum ChangeLogEntity {
  CATEGORY = 'CATEGORY',
  TYPE = 'TYPE',
  CONNECTION = 'CONNECTION',
}

export type ChangeLogSnapshot = Record<string, unknown>

type CategoryTypeChangeLogAttributes = {
  id: string
  actorId: string
  actorName: string | null
  action: ChangeLogAction
  entityType: ChangeLogEntity
  entityId: string | null
  before: ChangeLogSnapshot | null
  after: ChangeLogSnapshot | null
  affectedAdvertCount: number
  affectedAdvertIds: string[] | null
  revertsAuditId: string | null
  createdAt: Date
}

export type CategoryTypeChangeLogCreateAttributes = Omit<
  CategoryTypeChangeLogAttributes,
  'id' | 'createdAt'
>

@ParanoidTable({
  tableName: LegalGazetteModels.CATEGORY_TYPE_CHANGE_LOG,
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class CategoryTypeChangeLogModel extends Model<
  CategoryTypeChangeLogAttributes,
  CategoryTypeChangeLogCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'actor_id' })
  actorId!: string

  @Column({ type: DataType.STRING, allowNull: true, field: 'actor_name' })
  actorName!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ChangeLogAction)),
    allowNull: false,
  })
  action!: ChangeLogAction

  @Column({
    type: DataType.ENUM(...Object.values(ChangeLogEntity)),
    allowNull: false,
    field: 'entity_type',
  })
  entityType!: ChangeLogEntity

  @Column({ type: DataType.UUID, allowNull: true, field: 'entity_id' })
  entityId!: string | null

  @Column({ type: DataType.JSONB, allowNull: true })
  before!: ChangeLogSnapshot | null

  @Column({ type: DataType.JSONB, allowNull: true })
  after!: ChangeLogSnapshot | null

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'affected_advert_count',
  })
  affectedAdvertCount!: number

  @Column({ type: DataType.JSONB, allowNull: true, field: 'affected_advert_ids' })
  affectedAdvertIds!: string[] | null

  @Column({ type: DataType.UUID, allowNull: true, field: 'reverts_audit_id' })
  revertsAuditId!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  override createdAt!: Date

  static fromModel(model: CategoryTypeChangeLogModel): CategoryTypeChangeLogDto {
    return {
      id: model.id,
      actorId: model.actorId,
      actorName: model.actorName ?? undefined,
      action: model.action,
      entityType: model.entityType,
      entityId: model.entityId ?? undefined,
      before: model.before ?? undefined,
      after: model.after ?? undefined,
      affectedAdvertCount: model.affectedAdvertCount,
      affectedAdvertIds: model.affectedAdvertIds ?? undefined,
      revertsAuditId: model.revertsAuditId ?? undefined,
      createdAt: model.createdAt,
    }
  }

  fromModel(): CategoryTypeChangeLogDto {
    return CategoryTypeChangeLogModel.fromModel(this)
  }
}

export class CategoryTypeChangeLogDto {
  @ApiUUId()
  id!: string

  @ApiString()
  actorId!: string

  @ApiOptionalString()
  actorName?: string

  @ApiEnum(ChangeLogAction, { enumName: 'ChangeLogAction' })
  action!: ChangeLogAction

  @ApiEnum(ChangeLogEntity, { enumName: 'ChangeLogEntity' })
  entityType!: ChangeLogEntity

  @ApiOptionalUuid()
  entityId?: string

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  before?: ChangeLogSnapshot

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  after?: ChangeLogSnapshot

  @ApiNumber()
  affectedAdvertCount!: number

  @ApiOptionalArray({ type: String })
  affectedAdvertIds?: string[]

  @ApiOptionalUuid()
  revertsAuditId?: string

  @ApiDateTime()
  createdAt!: Date
}
