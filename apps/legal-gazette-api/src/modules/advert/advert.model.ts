import { Op } from 'sequelize'
import {
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { validateAdvertStatus } from '../../lib/utils'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { CourtDistrictModel } from '../court-district/court-district.model'
import { SettlementModel } from '../settlement/settlement.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TypeIdEnum, TypeModel } from '../type/type.model'
import { AdvertDto, AdvertStatusCounterItemDto } from './dto/advert.dto'

type AdvertAttributes = {
  caseId: string
  settlementId: string | null
  courtDistrictId: string | null
  islandIsApplicationId: string | null

  typeId: string
  categoryId: string
  statusId: string

  publicationNumber: string | null
  version: AdvertVersionEnum
  publishedAt: Date | null
  scheduledAt: Date

  title: string
  createdBy: string
  html: string
  paid: boolean

  additionalText: string | null
  caption: string | null

  signatureName: string
  signatureOnBehalfOf: string | null
  signatureLocation: string
  signatureDate: Date

  type: TypeModel
  category: CategoryModel
  status: StatusModel
  case: CaseModel
}

export type AdvertCreateAttributes = {
  caseId?: string
  settlementId?: string | null
  courtDistrictId?: string | null
  islandIsApplicationId?: string | null

  typeId: string
  categoryId: string
  statusId?: string

  version?: AdvertVersionEnum
  publishedAt?: Date | null // only if coming from an external system (ex. Skatturinn) and should be automatically set
  scheduledAt: Date

  createdBy: string // ex: Gunnar Gunnarsson or Lögfræðistofa (Gunnar Gunnarsson)
  additionalText?: string | null
  caption?: string | null

  signatureName: string
  signatureOnBehalfOf?: string | null
  signatureLocation: string
  signatureDate: Date
}

export enum AdvertVersionEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum AdvertModelScopes {
  IN_PROGRESS = 'inProgress',
  TO_BE_PUBLISHED = 'toBePublished',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT })
@DefaultScope(() => ({
  include: [StatusModel, CategoryModel, TypeModel],
  order: [
    ['scheduledAt', 'ASC'],
    ['version', 'ASC'],
  ],
}))
@Scopes(() => ({
  inProgress: {
    include: [StatusModel, CategoryModel, TypeModel],
    where: {
      statusId: {
        [Op.in]: [StatusIdEnum.SUBMITTED, StatusIdEnum.READY_FOR_PUBLICATION],
      },
      publishedAt: { [Op.eq]: null },
    },
    order: [['scheduledAt', 'ASC']],
  },
  published: {
    include: [StatusModel, CategoryModel, TypeModel],
    where: {
      publishedAt: { [Op.ne]: null },
      statusId: StatusIdEnum.PUBLISHED,
    },
    order: [['publishedAt', 'DESC']],
  },
  toBePublished: {
    include: [StatusModel, CategoryModel, TypeModel],
    order: [['scheduledAt', 'ASC']],
    where: {
      paid: true,
      statusId: StatusIdEnum.READY_FOR_PUBLICATION,
      publishedAt: { [Op.eq]: null },
    },
  },
  completed: {
    include: [StatusModel, CategoryModel, TypeModel],
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
}))
export class AdvertModel extends BaseModel<
  AdvertAttributes,
  AdvertCreateAttributes
> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  @ForeignKey(() => CaseModel)
  caseId!: string

  @Column({ type: DataType.UUID })
  @ForeignKey(() => SettlementModel)
  settlementId!: string | null

  @Column({ type: DataType.UUID })
  @ForeignKey(() => CourtDistrictModel)
  courtDistrictId!: string | null

  @Column({
    type: DataType.UUID,
  })
  islandIsApplicationId!: string | null

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'advert_type_id',
  })
  @ForeignKey(() => TypeModel)
  typeId!: TypeIdEnum

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
    allowNull: false,
  })
  scheduledAt!: Date

  @Column({
    type: DataType.DATE,
    defaultValue: null,
  })
  publishedAt!: Date | null

  @Column({
    type: DataType.ENUM(...Object.values(AdvertVersionEnum)),
    allowNull: false,
    defaultValue: AdvertVersionEnum.A,
  })
  version!: AdvertVersionEnum

  @Column({
    type: DataType.TEXT,
    unique: true,
    defaultValue: null,
  })
  publicationNumber!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  html!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  createdBy!: string

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  signatureName!: string

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  signatureOnBehalfOf!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  signatureLocation!: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  signatureDate!: Date

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  paid!: boolean

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  @BelongsTo(() => StatusModel)
  status!: StatusModel

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

    const [status, count] = await Promise.all([
      StatusModel.findByPk(statusId),
      this.count({
        where: {
          statusId,
        },
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
    return {
      id: model.id,
      caseId: model.caseId,
      title: model.title,
      html: model.html,
      owner: model.createdBy,
      publicationNumber: model.publicationNumber,
      scheduledAt: model.scheduledAt.toISOString(),
      publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
      version: model.version,
      category: model.category.fromModel(),
      status: model.status.fromModel(),
      type: model.type.fromModel(),
      signatureDate: model.signatureDate.toISOString(),
      signatureLocation: model.signatureLocation,
      signatureName: model.signatureName,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
      paid: model.paid,
    }
  }

  fromModel(): AdvertDto {
    return AdvertModel.fromModel(this)
  }
}
