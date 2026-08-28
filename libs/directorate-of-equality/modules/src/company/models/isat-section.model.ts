import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { DoeModels } from '../../constants'
import type { IsatSectionDto } from '../dto/isat-section.dto'
import { IsatCategoryModel } from './isat-category.model'

/**
 * One of the 22 ÍSAT2008 sections (bálkar): the 21 NACE Rev. 2 sections A–U,
 * plus X (Óþekkt starfsemi), which ÍSAT2008 adds and NACE has no equivalent for.
 * Reference data — the canonical set is seeded by migration and never changes;
 * static lookup, so no created_at/updated_at (same shape as `IsatCategoryModel`).
 *
 * Leaf categories roll up into a section via `isat_category.section`, exactly as
 * postcodes roll up into a region — so a company's section is reached through
 * `company → isat_category → isat_section` and is never stored on the company.
 * This is what makes "all public administration" a single filter value (section
 * `O`) instead of an enumeration of every leaf under division 84.
 *
 * The section letter is not arithmetic on the code but is a total function of
 * the 2-digit division — except for X, which shares division 99 with U and so is
 * matched on the whole code. The mapping lives in the `isat_section_for_code()`
 * SQL function so the migration backfill and the seeder share one definition.
 */
type IsatSectionAttributes = {
  code: string
  description: string
  descriptionEn: string
}

@Table({ tableName: DoeModels.ISAT_SECTION, timestamps: false })
export class IsatSectionModel extends Model<IsatSectionAttributes> {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  code!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'description_en' })
  descriptionEn!: string

  @HasMany(() => IsatCategoryModel, {
    foreignKey: 'section',
    sourceKey: 'code',
    as: 'categories',
  })
  categories?: IsatCategoryModel[]

  static fromModel(model: IsatSectionModel): IsatSectionDto {
    return {
      code: model.code,
      description: model.description,
      descriptionEn: model.descriptionEn,
    }
  }

  fromModel(): IsatSectionDto {
    return IsatSectionModel.fromModel(this)
  }
}
