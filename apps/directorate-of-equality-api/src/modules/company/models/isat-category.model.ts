import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { DoeModels } from '../../../core/constants'
import type { IsatCategoryDto } from '../dto/isat-category.dto'

/**
 * ÍSAT2008 industry classification (Hagstofan). Reference data — seeded with the
 * 665 leaf (5-digit / two-dot) codes; this migration only creates the table.
 * `code` is the normalized form (e.g. "01110") and the natural PK that
 * `company.isat_category_code` references; `code_dotted` (e.g. "01.11.0") is for
 * display. Static lookup, so no created_at/updated_at. See db/README.md.
 */
type IsatCategoryAttributes = {
  code: string
  codeDotted: string
  description: string
  descriptionEn: string
}

@Table({ tableName: DoeModels.ISAT_CATEGORY, timestamps: false })
export class IsatCategoryModel extends Model<IsatCategoryAttributes> {
  @PrimaryKey
  @Column({ type: DataType.TEXT })
  code!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'code_dotted' })
  codeDotted!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'description_en' })
  descriptionEn!: string

  static fromModel(model: IsatCategoryModel): IsatCategoryDto {
    return {
      code: model.code,
      codeDotted: model.codeDotted,
      description: model.description,
      descriptionEn: model.descriptionEn,
    }
  }

  fromModel(): IsatCategoryDto {
    return IsatCategoryModel.fromModel(this)
  }
}
