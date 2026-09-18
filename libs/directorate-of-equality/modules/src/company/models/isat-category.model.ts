import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { DoeModels } from '../../constants'
import type { IsatCategoryDto } from '../dto/isat-category.dto'
import { IsatSectionModel } from './isat-section.model'

/**
 * ÍSAT2008 industry classification (Hagstofan). Reference data — seeded with the
 * 665 leaf (5-digit / two-dot) codes; this migration only creates the table.
 * `code` is the normalized form (e.g. "01110") and the natural PK that
 * `company.isat_category_code` references; `code_dotted` (e.g. "01.11.0") is for
 * display. Static lookup, so no created_at/updated_at. See db/README.md.
 *
 * `section` (bálkur letter, FK into `isat_section`) and `division` (2-digit
 * prefix) are the rollup levels the admin filters use — both derived from `code`
 * and kept NOT NULL, so filtering by section never silently drops a leaf.
 */
type IsatCategoryAttributes = {
  code: string
  codeDotted: string
  description: string
  descriptionEn: string
  section: string
  division: string
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

  @ForeignKey(() => IsatSectionModel)
  @Column({ type: DataType.TEXT, allowNull: false })
  section!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  division!: string

  @BelongsTo(() => IsatSectionModel, {
    foreignKey: 'section',
    targetKey: 'code',
    as: 'isatSection',
  })
  isatSection?: IsatSectionModel | null

  static fromModel(model: IsatCategoryModel): IsatCategoryDto {
    return {
      code: model.code,
      codeDotted: model.codeDotted,
      description: model.description,
      descriptionEn: model.descriptionEn,
      section: model.section,
      division: model.division,
      isatSection: model.isatSection
        ? model.isatSection.fromModel()
        : null,
    }
  }

  fromModel(): IsatCategoryDto {
    return IsatCategoryModel.fromModel(this)
  }
}
