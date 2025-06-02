import { HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { CaseCategoryModel } from '../case-category/case-category.model'

export enum CaseTypeIdEnum {
  COMMON_APPLICATION = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
}

export enum CaseTypeSlugEnum {
  COMMON_APPLICATION = 'almenn-auglysing',
}

@BaseEntityTable({ tableName: LegalGazetteModels.CASE_TYPE })
export class CaseTypeModel extends BaseEntityModel {
  @HasMany(() => CaseCategoryModel)
  categories!: CaseCategoryModel[]
}
