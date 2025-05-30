import { Op } from 'sequelize'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { getLogger } from '@dmr.is/logging'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { CaseTypeModel } from '../case-type/case-type.model'
import { CaseModel } from '../cases/cases.model'

const LOGGING_CATEGORY = 'advert-model'

type AdvertAttributes = {
  caseId: string
  publicationNumber: string
  publishedAt: Date | null
  html: string
  case: CaseModel
}

export type AdvertCreateAttributes = {
  html?: string
  scheduledAt: Date
  version?: AdvertVersion
  caseId?: string
}

export enum AdvertVersion {
  A = 'A',
  B = 'B',
  C = 'C',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  include: [
    {
      model: CaseModel.unscoped(),
      attributes: ['caseNumber'],
      include: [CaseTypeModel],
      required: true,
    },
  ],
  where: {
    publishedAt: {
      [Op.ne]: null,
    },
  },
  order: [['publishedAt', 'DESC']],
}))
@Scopes(() => ({
  inprogress: {
    where: {
      published: {
        [Op.ne]: null,
      },
    },
    include: [
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        include: [CaseTypeModel],
        required: true,
      },
    ],
    order: [['scheduled_at', 'ASC']],
  },
  detailed: {
    include: [
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        include: [CaseTypeModel],
        required: true,
      },
    ],
  },
}))
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
    type: DataType.VIRTUAL,
  })
  get publicationNumber(): string {
    const advertCase = this.getDataValue('case')

    return advertCase.caseNumber
  }

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
    type: DataType.ENUM(...Object.values(AdvertVersion)),
    allowNull: false,
    defaultValue: AdvertVersion.A,
    field: 'version',
  })
  version!: AdvertVersion

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '',
  })
  html!: string

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  static async publish(advertId: string) {
    const now = new Date()
    const logger = getLogger(LOGGING_CATEGORY)

    const advert = await this.scope('inprogress').findByPk(advertId)

    if (!advert) {
      logger.error(`Advert with ID ${advertId} not found`, {
        context: 'AdvertModel',
      })

      throw new NotFoundException('Advert not found')
    }

    logger.info(`Publishing advert with ID: ${advertId}`, {
      context: 'AdvertModel',
    })

    await advert.update({
      publishedAt: now,
    })
  }
}
