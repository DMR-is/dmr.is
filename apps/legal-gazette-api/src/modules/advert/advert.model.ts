import { Op } from 'sequelize'
import { BeforeCreate, Column, DataType } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

type AdvertAttributes = {
  publicationNumber: string
  publishedAt: Date | null
  html: string
}

type AdvertCreateAttributes = {
  html: string
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'published_at',
    defaultValue: null,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'publication_number',
  })
  publicationNumber!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  html!: string

  @BeforeCreate
  static async generatePublicationNumber(instance: AdvertModel) {
    const year = instance.createdAt.getFullYear()
    const count = await AdvertModel.count({
      where: { publicationNumber: { [Op.like]: `${year}%` } },
    })

    instance.publicationNumber = `${year}${String(count + 1).padStart(6, '0')}`
  }
}
