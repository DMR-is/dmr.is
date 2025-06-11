import { Op } from 'sequelize'
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import { BadRequestException, NotFoundException } from '@nestjs/common'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { AdvertCategoryModel } from '../advert-category/advert-category.model'
import {
  AdvertStatusIdEnum,
  AdvertStatusModel,
} from '../advert-status/advert-status.model'
import { AdvertTypeModel } from '../advert-type/advert-type.model'
import { CaseModel } from '../case/case.model'
import {
  CommonAdvertCreationAttributes,
  CommonAdvertModel,
} from '../common-advert/common-advert.model'
import {
  AdvertStatusCounterItemDto,
  GetAdvertsQueryDto,
} from './dto/advert.dto'

type AdvertAttributes = {
  caseId: string
  title: string
  html: string
  publicationNumber: string
  publishedAt: Date | null
  scheduledAt: Date
  version: AdvertVersionEnum
  typeId: string
  categoryId: string
  statusId: string
  paid: boolean
  type: AdvertTypeModel
  category: AdvertCategoryModel
  status: AdvertStatusModel
  case: CaseModel
}

export type AdvertCreateAttributes = {
  title: string
  caseId?: string
  html?: string
  typeId: string
  categoryId: string
  statusId?: string
  paid?: boolean
  publishedAt?: Date | null
  scheduledAt: Date
  version?: AdvertVersionEnum
  commonAdvert?: CommonAdvertCreationAttributes
}

export enum AdvertVersionEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  include: [
    AdvertStatusModel,
    AdvertCategoryModel,
    AdvertTypeModel,
    CommonAdvertModel,
    {
      model: CaseModel.unscoped(),
      attributes: ['caseNumber'],
      required: true,
    },
  ],
  where: {
    statusId: {
      [Op.in]: [
        AdvertStatusIdEnum.SUBMITTED,
        AdvertStatusIdEnum.READY_FOR_PUBLICATION,
      ],
    },
    publishedAt: {
      [Op.eq]: null,
    },
  },
  order: [['scheduledAt', 'ASC']],
}))
@Scopes(() => ({
  published: {
    include: [
      AdvertStatusModel,
      AdvertCategoryModel,
      AdvertTypeModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
    ],
    where: {
      publishedAt: { [Op.ne]: null },
      statusId: AdvertStatusIdEnum.PUBLISHED,
    },
    order: [['publishedAt', 'DESC']],
  },
  completed: {
    include: [
      AdvertStatusModel,
      AdvertCategoryModel,
      AdvertTypeModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
        paranoid: false,
      },
    ],
    order: [['updatedAt', 'ASC']],
    where: {
      statusId: {
        [Op.in]: [
          AdvertStatusIdEnum.PUBLISHED,
          AdvertStatusIdEnum.REJECTED,
          AdvertStatusIdEnum.WITHDRAWN,
        ],
      },
    },
  },
  withQuery: (query?: GetAdvertsQueryDto) => {
    const whereClause: Record<string, string | number> = {}

    if (query?.statusId) {
      Object.assign(whereClause, {
        statusId: {
          [Op.in]: query.statusId,
        },
      })
    }

    if (query?.categoryId) {
      Object.assign(whereClause, {
        categoryId: query.categoryId,
      })
    }

    return {
      where: whereClause,
    }
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
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_type_id',
  })
  @ForeignKey(() => AdvertTypeModel)
  typeId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_category_id',
  })
  @ForeignKey(() => AdvertCategoryModel)
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_status_id',
    defaultValue: AdvertStatusIdEnum.SUBMITTED,
  })
  @ForeignKey(() => AdvertStatusModel)
  statusId!: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'scheduled_at',
  })
  scheduledAt!: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'published_at',
    defaultValue: null,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'html',
    defaultValue: '',
  })
  html!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'title',
  })
  title!: string

  @Column({
    type: DataType.ENUM(...Object.values(AdvertVersionEnum)),
    allowNull: false,
    defaultValue: AdvertVersionEnum.A,
    field: 'version',
  })
  version!: AdvertVersionEnum

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'paid',
  })
  paid!: boolean

  @Column({
    type: DataType.VIRTUAL,
  })
  get publicationNumber(): string {
    const advertCase = this.getDataValue('case')

    return advertCase.caseNumber
  }

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModel

  @BelongsTo(() => AdvertCategoryModel)
  category!: AdvertCategoryModel

  @BelongsTo(() => AdvertStatusModel)
  status!: AdvertStatusModel

  @HasOne(() => CommonAdvertModel, {
    foreignKey: 'id',
  })
  commonAdvert?: CommonAdvertModel

  static async countByStatus(
    statusId: AdvertStatusIdEnum,
  ): Promise<AdvertStatusCounterItemDto> {
    this.logger.info(`Counting adverts with status ID: ${statusId}`, {
      context: 'AdvertModel',
    })

    const whereClause: Record<string, any> = {
      statusId,
    }

    const [status, count] = await Promise.all([
      AdvertStatusModel.findByPk(statusId),
      this.count({
        where: whereClause,
      }),
    ])

    if (!status) {
      this.logger.error(`Advert status with ID ${statusId} not found`, {
        context: 'AdvertModel',
      })

      throw new BadRequestException('Invalid advert status')
    }

    return {
      status: {
        id: status.id,
        title: status.title,
        slug: status.slug,
      },
      count,
    }
  }

  static async setStatus(advertId: string, statusId: AdvertStatusIdEnum) {
    const advert = await this.findByPk(advertId)

    if (!advert) {
      this.logger.error(`Advert with ID ${advertId} not found`, {
        context: 'AdvertModel',
      })

      throw new NotFoundException('Advert not found')
    }

    this.logger.info(`Setting status for advert with ID: ${advertId}`, {
      context: 'AdvertModel',
    })

    await advert.update({
      statusId,
    })
  }

  static async publish(advertId: string) {
    const now = new Date()

    const advert = await this.scope('tobepublished').findByPk(advertId)

    if (!advert) {
      this.logger.warn(`Advert with ID ${advertId} not found`, {
        context: 'AdvertModel',
      })

      throw new NotFoundException('Advert not found')
    }

    this.logger.info(`Publishing advert with ID: ${advertId}`, {
      context: 'AdvertModel',
    })

    await advert.update({
      publishedAt: now,
      statusId: AdvertStatusIdEnum.PUBLISHED,
    })
  }
}
