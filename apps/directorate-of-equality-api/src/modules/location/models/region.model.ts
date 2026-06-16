import { Column, DataType, HasMany } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { RegionDto } from '../dto/region.dto'
import { PostcodeModel } from './postcode.model'

/**
 * One of Iceland's eight landshlutar (regions). Reference data — the canonical
 * set is seeded by migration and rarely changes. Postcodes roll up into a
 * region, so a company's region is reached via `company → postcode → region`;
 * the region is never stored on the company directly.
 *
 * `code` is the stable machine key (e.g. CAPITAL) used by downstream seeders
 * (postcodes) to resolve a region without depending on a generated UUID.
 */
type RegionAttributes = {
  code: string
  name: string
}

type RegionCreateAttributes = {
  code: string
  name: string
}

@MutableTable({ tableName: DoeModels.REGION })
export class RegionModel extends MutableModel<
  RegionAttributes,
  RegionCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  code!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @HasMany(() => PostcodeModel, { foreignKey: 'regionId', as: 'postcodes' })
  postcodes?: PostcodeModel[]

  static fromModel(model: RegionModel): RegionDto {
    return {
      id: model.id,
      code: model.code,
      name: model.name,
    }
  }

  fromModel(): RegionDto {
    return RegionModel.fromModel(this)
  }
}
