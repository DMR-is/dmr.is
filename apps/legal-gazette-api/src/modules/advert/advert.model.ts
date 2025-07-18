import { Op, WhereOptions } from 'sequelize'
import {
  BeforeUpdate,
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

import { validateAdvertStatus } from '../../lib/utils'
import {
  BankruptcyAdvertCreationAttributes,
  BankruptcyAdvertModel,
} from '../bankruptcy-advert/models/bankruptcy-advert.model'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import {
  CommonAdvertCreationAttributes,
  CommonAdvertModel,
} from '../common-advert/common-advert.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TypeIdEnum, TypeModel } from '../type/type.model'
import {
  AdvertDetailedDto,
  AdvertDto,
  AdvertStatusCounterItemDto,
  GetAdvertsQueryDto,
} from './dto/advert.dto'

type AdvertAttributes = {
  caseId: string
  title: string
  html: string
  submittedBy: string
  publicationNumber: string
  publishedAt: Date | null
  scheduledAt: Date
  version: AdvertVersionEnum
  typeId: string
  categoryId: string
  statusId: string
  paid: boolean
  type: TypeModel
  category: CategoryModel
  status: StatusModel
  case: CaseModel
}

export type AdvertCreateAttributes = {
  title: string
  submittedBy: string
  typeId: string
  categoryId: string
  scheduledAt: Date
  caseId?: string
  html?: string
  statusId?: string
  paid?: boolean
  publishedAt?: Date | null
  version?: AdvertVersionEnum
  commonAdvert?: CommonAdvertCreationAttributes
  bankruptcyAdvert?: BankruptcyAdvertCreationAttributes
}

export enum AdvertVersionEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum AdvertModelScopes {
  DEFAULT = 'defaultScope',
  READY_FOR_PUBLICATION = 'readyForPublication',
  TO_BE_PUBLISHED = 'toBePublished',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  BANKRUPTCY_ADVERT = 'bankruptcyAdvert',
  ALL = 'all',
  WITH_QUERY = 'withQuery',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  include: [
    StatusModel,
    CategoryModel,
    TypeModel,
    CommonAdvertModel,
    {
      model: CaseModel.unscoped(),
      attributes: ['caseNumber'],
      required: true,
    },
  ],
  where: {
    statusId: {
      [Op.in]: [StatusIdEnum.SUBMITTED, StatusIdEnum.READY_FOR_PUBLICATION],
    },
    publishedAt: {
      [Op.eq]: null,
    },
  },
  order: [['scheduledAt', 'ASC']],
}))
@Scopes(() => ({
  readyForPublication: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
    ],
    where: {
      statusId: StatusIdEnum.READY_FOR_PUBLICATION,
      publishedAt: { [Op.eq]: null },
    },
    order: [['scheduledAt', 'ASC']],
  },
  toBePublished: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
    ],
    where: {
      paid: true,
      statusId: StatusIdEnum.READY_FOR_PUBLICATION,
      publishedAt: { [Op.eq]: null },
    },
    order: [['scheduledAt', 'ASC']],
  },
  published: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
    ],
    where: {
      publishedAt: { [Op.ne]: null },
      statusId: StatusIdEnum.PUBLISHED,
    },
    order: [['publishedAt', 'DESC']],
  },
  completed: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
        paranoid: false,
      },
    ],
    order: [['scheduledAt', 'ASC']],
    where: {
      statusId: {
        [Op.in]: [
          StatusIdEnum.PUBLISHED,
          StatusIdEnum.REJECTED,
          StatusIdEnum.WITHDRAWN,
        ],
      },
    },
  },
  all: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        duplicating: false,
        attributes: ['caseNumber'],
        required: true,
      },
    ],
    where: {},
    order: [['version', 'ASC']],
  },
  bankruptcyAdvert: {
    include: [
      StatusModel,
      CategoryModel,
      TypeModel,
      CommonAdvertModel,
      {
        model: CaseModel.unscoped(),
        attributes: ['caseNumber'],
        required: true,
      },
      BankruptcyAdvertModel,
    ],
    where: {
      typeId: {
        [Op.eq]: TypeIdEnum.BANKRUPTCY_ADVERT,
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

    if (query?.typeId) {
      Object.assign(whereClause, {
        typeId: query.typeId,
      })
    }

    if (query?.dateFrom && !query?.dateTo) {
      Object.assign(whereClause, {
        publishedAt: {
          [Op.gte]: new Date(query.dateFrom),
        },
      })
    }

    if (query?.dateTo && !query?.dateFrom) {
      Object.assign(whereClause, {
        publishedAt: {
          [Op.lte]: new Date(query.dateTo),
        },
      })
    }

    if (query?.dateFrom && query?.dateTo) {
      Object.assign(whereClause, {
        publishedAt: {
          [Op.between]: [new Date(query.dateFrom), new Date(query.dateTo)],
        },
      })
    }

    if (query?.search) {
      Object.assign(whereClause, {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query.search}%` } },
          { publicationNumber: { [Op.iLike]: `%${query.search}%` } },
        ],
      })
    }

    return {
      include: [
        StatusModel,
        CategoryModel,
        TypeModel,
        CommonAdvertModel,
        {
          model: CaseModel.unscoped(),
          attributes: ['caseNumber'],
          required: true,
        },
      ],
      where: whereClause,
      order: [['scheduledAt', 'ASC']],
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
  @ForeignKey(() => TypeModel)
  typeId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_category_id',
  })
  @ForeignKey(() => CategoryModel)
  categoryId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_status_id',
    defaultValue: StatusIdEnum.SUBMITTED,
  })
  @ForeignKey(() => StatusModel)
  statusId!: StatusIdEnum

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
    defaultValue: true, // TODO: Change to false when adverts are not paid by default
    field: 'paid',
  })
  paid!: boolean

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'submitted_by',
  })
  submittedBy!: string

  @Column({
    type: DataType.TEXT,
    field: 'publication_number',
    unique: true,
    allowNull: true,
    defaultValue: null,
  })
  publicationNumber!: string | null

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  @BelongsTo(() => StatusModel)
  status!: StatusModel

  @HasOne(() => CommonAdvertModel, { foreignKey: 'advertId' })
  commonAdvert?: CommonAdvertModel

  @HasOne(() => BankruptcyAdvertModel, {
    foreignKey: 'advertId',
  })
  bankruptcyAdvert?: BankruptcyAdvertModel

  @BeforeUpdate
  static validateUpdate(instance: AdvertModel) {
    validateAdvertStatus(instance)
  }

  static async countByStatus(
    statusId: StatusIdEnum,
  ): Promise<AdvertStatusCounterItemDto> {
    this.logger.info(`Counting adverts with status ID: ${statusId}`, {
      context: 'AdvertModel',
    })

    const whereClause: WhereOptions = {
      statusId,
    }

    const [status, count] = await Promise.all([
      StatusModel.findByPk(statusId),
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

  static async publish(model: AdvertModel) {
    const now = new Date()
    this.logger.info(`Publishing advert at ${now}`, {
      context: 'AdvertModel',
      advertId: model.id,
      timestamp: now,
    })

    if (model.statusId !== StatusIdEnum.READY_FOR_PUBLICATION) {
      this.logger.error(
        `Advert with ID ${model.id} is not ready for publication`,
        {
          context: 'AdvertModel',
        },
      )
      throw new BadRequestException('Advert is not ready for publication')
    }

    if (model.publishedAt !== null) {
      this.logger.error(`Advert with ID ${model.id} is already published`, {
        context: 'AdvertModel',
      })
      throw new BadRequestException('Advert is already published')
    }

    const startDate = now.setHours(0, 0, 0, 0)
    const endDate = now.setHours(23, 59, 59, 999)

    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    const count = await AdvertModel.count({
      where: {
        publishedAt: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.gte]: startDate },
            { [Op.lt]: endDate },
          ],
        },
      },
    })

    const padded = (count + 1).toString().padStart(3, '0')

    const publicationNumber = `${year}${month}${day}${padded}`

    await model.update({
      publicationNumber: publicationNumber,
      publishedAt: new Date(),
      statusId: StatusIdEnum.PUBLISHED,
    })
  }

  publishAdvert(): Promise<void> {
    return AdvertModel.publish(this)
  }

  static fromModel(model: AdvertModel): AdvertDto {
    try {
      if (!model) {
        throw new NotFoundException('Advert not found')
      }

      return {
        id: model.id,
        caseId: model.caseId,
        title: model.title,
        html: model.html,
        owner: model.submittedBy,
        publicationNumber: model.publicationNumber,
        scheduledAt: model.scheduledAt.toISOString(),
        publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
        version: model.version,
        category: model.category.fromModel(),
        status: model.status.fromModel(),
        type: model.type.fromModel(),
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
        paid: model.paid,
      }
    } catch (error) {
      this.logger.debug(
        `fromModel failed for AdvertModel, did you include everything?`,
      )
      throw error
    }
  }

  fromModel(): AdvertDto {
    return AdvertModel.fromModel(this)
  }

  static fromModelDetailed(model: AdvertModel): AdvertDetailedDto {
    try {
      return {
        id: model.id,
        caseId: model.caseId,
        title: model.title,
        html: model.html,
        owner: model.submittedBy,
        publicationNumber: model.publicationNumber,
        scheduledAt: model.scheduledAt.toISOString(),
        publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
        version: model.version,
        category: model.category.fromModel(),
        status: model.status.fromModel(),
        type: model.type.fromModel(),
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
        paid: model.paid,
        commonAdvert: model.commonAdvert
          ? model.commonAdvert.fromModel()
          : undefined,
        bankruptcyAdvert: model.bankruptcyAdvert
          ? model.bankruptcyAdvert.fromModel()
          : undefined,
      }
    } catch (error) {
      this.logger.debug(`fromModelDetailed failed for AdvertModel`, {
        context: 'AdvertModel',
      })

      throw error
    }
  }

  fromModelDetailed(): AdvertDetailedDto {
    return AdvertModel.fromModelDetailed(this)
  }
}
