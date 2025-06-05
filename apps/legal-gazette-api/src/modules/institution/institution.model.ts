import {
  BeforeCreate,
  BelongsToMany,
  Column,
  DataType,
  DefaultScope,
} from 'sequelize-typescript'
import slugify from 'slugify'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { UserInstitutionModel } from '../users/user-institutions.model'
import { UserModel } from '../users/users.model'

type InstitutionAttributes = {
  title: string
  slug: string
  nationalId: string
}

export type InstitutionCreateAttributes = {
  title: string
  slug: string
  nationalId: string
}

@BaseTable({ tableName: LegalGazetteModels.INSTITUTIONS })
@DefaultScope(() => ({
  attributes: ['id', 'title', 'slug', 'nationalId'],
  orderBy: [['title', 'ASC']],
}))
export class InstitutionModel extends BaseModel<
  InstitutionAttributes,
  InstitutionCreateAttributes
> {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'title',
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'slug',
    unique: true,
  })
  slug!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'national_id',
    unique: true,
  })
  nationalId!: string

  @BelongsToMany(() => UserModel, () => UserInstitutionModel)
  users!: UserModel[]

  @BeforeCreate
  slugit(instance: InstitutionModel) {
    instance.slug = slugify(instance.slug, { lower: true })
  }
}
