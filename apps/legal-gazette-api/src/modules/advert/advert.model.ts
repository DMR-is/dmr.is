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

import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import {
  CommonAdvertCreationAttributes,
  CommonAdvertModel,
} from '../common-advert/common-advert.model'
import { InstitutionModel } from '../institution/institution.model'
import { StatusIdEnum, StatusModel } from '../status/status.model'
import { TypeModel } from '../type/type.model'
import { UserModel } from '../users/users.model'
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
  publicationNumber: string
  publishedAt: Date | null
  scheduledAt: Date
  version: AdvertVersionEnum
  typeId: string
  categoryId: string
  statusId: string
  institutionId: string | null
  paid: boolean
  type: TypeModel
  category: CategoryModel
  status: StatusModel
  institution?: InstitutionModel
  user: UserModel
  case: CaseModel
}

export type AdvertCreateAttributes = {
  title: string
  userId: string
  institutionId?: string
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
    StatusModel,
    CategoryModel,
    TypeModel,
    CommonAdvertModel,
    InstitutionModel,
    UserModel,
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
      InstitutionModel,
      UserModel,
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
      InstitutionModel,
      UserModel,
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
      InstitutionModel,
      UserModel,
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
      InstitutionModel,
      UserModel,
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
      InstitutionModel,
      UserModel,
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
  statusId!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  @ForeignKey(() => UserModel)
  userId!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'institution_id',
    defaultValue: null,
  })
  @ForeignKey(() => InstitutionModel)
  institutionId!: string | null

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
    type: DataType.VIRTUAL,
  })
  get publicationNumber(): string {
    const advertCase = this.getDataValue('case')

    return advertCase.caseNumber
  }

  @BelongsTo(() => CaseModel, { foreignKey: 'caseId' })
  case!: CaseModel

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  @BelongsTo(() => CategoryModel)
  category!: CategoryModel

  @BelongsTo(() => StatusModel)
  status!: StatusModel

  @BelongsTo(() => InstitutionModel)
  institution?: InstitutionModel

  @BelongsTo(() => UserModel)
  user!: UserModel

  @HasOne(() => CommonAdvertModel, { foreignKey: 'advertId' })
  commonAdvert?: CommonAdvertModel

  static getOwner(model: AdvertModel): string {
    if (model.institution) {
      return model.institution.title
    }
    return `${model.user.firstName} ${model.user.lastName}`
  }

  static async countByStatus(
    statusId: StatusIdEnum,
  ): Promise<AdvertStatusCounterItemDto> {
    this.logger.info(`Counting adverts with status ID: ${statusId}`, {
      context: 'AdvertModel',
    })

    const whereClause: Record<string, any> = {
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
    this.logger.info(`Publishing advert`, {
      context: 'AdvertModel',
      advertId: model.id,
    })

    await model.update({
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
        owner: AdvertModel.getOwner(model),
        publicationNumber: model.publicationNumber,
        scheduledAt: model.scheduledAt.toISOString(),
        publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
        version: model.version,
        institution: model.institution?.fromModel() ?? null,
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
        owner: AdvertModel.getOwner(model),
        publicationNumber: model.publicationNumber,
        scheduledAt: model.scheduledAt.toISOString(),
        publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
        version: model.version,
        category: model.category.fromModel(),
        status: model.status.fromModel(),
        type: model.type.fromModel(),
        institution: model.institution?.fromModel() ?? null,
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
        deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
        paid: model.paid,
        commonAdvert: model.commonAdvert
          ? model.commonAdvert.fromModel()
          : undefined,
      }
    } catch (error: any) {
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
