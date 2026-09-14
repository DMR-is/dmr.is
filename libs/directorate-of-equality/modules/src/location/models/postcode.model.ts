// Association annotations use a type-only alias — see `src/models.ts`.
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { PostcodeDto } from '../dto/postcode.dto'
import type { RegionModel as RegionModelRef } from './region.model'
import { RegionModel } from './region.model'

/**
 * An Icelandic postcode (póstnúmer, e.g. "101"), mapping a 3-digit code to its
 * place/locality and the region it belongs to. Reference data — the canonical
 * ~150-row set is loaded by a separate sourced seeder; this migration only
 * creates the table. `place` carries the locality name (e.g. "Reykjavík"), so
 * companies do not need a free-text city of their own.
 */
type PostcodeAttributes = {
  code: string
  place: string
  regionId: string
}

type PostcodeCreateAttributes = {
  code: string
  place: string
  regionId: string
}

@MutableTable({ tableName: DoeModels.POSTCODE })
export class PostcodeModel extends MutableModel<
  PostcodeAttributes,
  PostcodeCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  code!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  place!: string

  @ForeignKey(() => RegionModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'region_id' })
  regionId!: string

  @BelongsTo(() => RegionModel, { foreignKey: 'regionId', as: 'region' })
  region?: RegionModelRef

  static fromModel(model: PostcodeModel): PostcodeDto {
    return {
      id: model.id,
      code: model.code,
      place: model.place,
      regionId: model.regionId,
    }
  }

  fromModel(): PostcodeDto {
    return PostcodeModel.fromModel(this)
  }
}
