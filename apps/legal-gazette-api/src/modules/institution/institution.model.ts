import {
  BeforeCreate,
  BeforeUpsert,
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
import { InstitutionDto } from './dto/institution.dto'

type InstitutionAttributes = {
  title: string
  slug: string
  nationalId: string
}

export type InstitutionCreateAttributes = {
  title: string
  nationalId: string
  slug?: string
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

  @BeforeUpsert
  @BeforeCreate
  static async slugit(instance: InstitutionModel) {
    const slug = slugify(instance.title, { lower: true })
    this.logger.debug('Slugifying institution title', instance.title, slug)
    instance.slug = slug
  }

  static fromModel(model: InstitutionModel): InstitutionDto {
    try {
      return {
        id: model.id,
        title: model.title,
        nationalId: model.nationalId,
        slug: model.slug,
      }
    } catch (error) {
      this.logger.error('fromModel failed for Institution model', {
        context: 'InstitutionModel',
      })
      throw error
    }
  }

  fromModel() {
    return InstitutionModel.fromModel(this)
  }
}
