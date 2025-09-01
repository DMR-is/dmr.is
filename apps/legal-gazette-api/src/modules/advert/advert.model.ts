import { BulkCreateOptions, Op } from 'sequelize'
import {
  AfterCreate,
  BeforeBulkCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { getAdvertHTMLMarkup } from '../../lib/templates'
import { validateAdvertStatus } from '../../lib/utils'
import {
  AdvertPublicationsCreateAttributes,
  AdvertPublicationsModel,
} from '../advert-publications/advert-publications.model'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { CourtDistrictModel } from '../court-district/court-district.model'
import {
  SettlementCreateAttributes,
  SettlementModel,
} from '../settlement/settlement.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TypeIdEnum, TypeModel } from '../type/type.model'
import { AdvertDto, AdvertStatusCounterItemDto } from './dto/advert.dto'

type AdvertAttributes = {
  caseId: string
  courtDistrictId: string | null
  islandIsApplicationId: string | null

  typeId: string
  categoryId: string
  statusId: string

  publicationNumber: string | null

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
  settlement?: SettlementModel
}

export type AdvertCreateAttributes = {
  caseId?: string
  courtDistrictId?: string | null
  islandIsApplicationId?: string | null

  typeId: string
  categoryId: string
  statusId?: string
  title: string
  html?: string

  createdBy: string // ex: Gunnar Gunnarsson or Lögfræðistofa (Gunnar Gunnarsson)
  additionalText?: string | null
  caption?: string | null

  signatureName: string
  signatureOnBehalfOf?: string | null
  signatureLocation: string
  signatureDate: Date

  // We must include the publications when creating an advert
  publications: AdvertPublicationsCreateAttributes[]
  settlement?: SettlementCreateAttributes
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
  include: [StatusModel, CategoryModel, TypeModel, AdvertPublicationsModel],
}))
@Scopes(() => ({
  inProgress: {
    include: [StatusModel, CategoryModel, TypeModel],
    where: {
      statusId: {
        [Op.in]: [StatusIdEnum.SUBMITTED, StatusIdEnum.READY_FOR_PUBLICATION],
      },
    },
  },
  published: {
    include: [StatusModel, CategoryModel, TypeModel],
    where: {
      statusId: StatusIdEnum.PUBLISHED,
    },
  },
  toBePublished: {
    include: [StatusModel, CategoryModel, TypeModel],
    where: {
      paid: true,
      statusId: StatusIdEnum.READY_FOR_PUBLICATION,
    },
  },
  completed: {
    include: [StatusModel, CategoryModel, TypeModel],
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

  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
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
    defaultValue: '',
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
    type: DataType.TEXT,
    allowNull: true,
  })
  additionalText!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  caption!: string | null

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

  @HasOne(() => SettlementModel)
  settlement?: SettlementModel

  @BelongsTo(() => CourtDistrictModel)
  courtDistrict?: CourtDistrictModel

  @HasMany(() => AdvertPublicationsModel)
  publications!: AdvertPublicationsModel[]

  @BeforeUpdate
  static validateUpdate(instance: AdvertModel) {
    validateAdvertStatus(instance)
  }

  @AfterCreate
  static async addHTML(instance: AdvertModel) {
    this.logger.debug(`Setting HTML template for advert ${instance.id}`, {
      currentHTML: instance.html,
    })

    const instanceWithRelations = await AdvertModel.unscoped().findByPkOrThrow(
      instance.id,
      {
        include: [
          { model: TypeModel },
          { model: CategoryModel },
          { model: StatusModel },
          { model: SettlementModel },
          { model: CourtDistrictModel },
          { model: CaseModel, attributes: ['caseNumber', 'id'] },
        ],
      },
    )

    if (instanceWithRelations.html) return

    const html = getAdvertHTMLMarkup(instanceWithRelations)
    instanceWithRelations.html = html
    instanceWithRelations.save()
  }

  @BeforeBulkCreate
  static addIndividualhooks(
    _models: AdvertModel[],
    options: BulkCreateOptions,
  ) {
    this.logger.debug('AfterBulkCreate, setting individualHooks to true')
    options.individualHooks = true
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

  static fromModel(model: AdvertModel): AdvertDto {
    return {
      id: model.id,
      caseId: model.caseId,
      title: model.title,
      html: model.html,
      createdBy: model.createdBy,
      publicationNumber: model.publicationNumber,
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
      publications: model.publications.map((p) => p.fromModel()),
    }
  }

  fromModel(): AdvertDto {
    return AdvertModel.fromModel(this)
  }
}
