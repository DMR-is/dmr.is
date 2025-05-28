import { Op } from 'sequelize'
import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { CaseModel } from '@dmr.is/modules'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

type AdvertAttributes = {
  caseId: string
  publicationNumber: string
  publishedAt: Date | null
  html: string
}

export type AdvertCreateAttributes = {
  html: string
  scheduledAt: Date
  caseId?: string
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'published_at',
    defaultValue: null,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'scheduled_at',
  })
  scheduledAt!: Date

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'publication_number',
    defaultValue: ''.padEnd(12, '0'), // Placeholder for publication number
  })
  publicationNumber!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  html!: string

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @BeforeCreate
  static async generatePublicationNumber(instance: AdvertModel) {
    const year = instance.createdAt.getFullYear()
    const count = await AdvertModel.count({
      where: { publicationNumber: { [Op.like]: `${year}%` } },
    })

    instance.publicationNumber = `${year}${String(count + 1).padStart(6, '0')}`
  }
}
