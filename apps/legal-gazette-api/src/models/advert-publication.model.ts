import { BulkCreateOptions, Op, WhereOptions } from 'sequelize'
import {
  BeforeBulkCreate,
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { BadRequestException } from '@nestjs/common'

import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../lib/constants'
import {
  AdvertPublicationDto,
  GetPublicationsQueryDto,
  PublishedPublicationDto,
} from '../modules/advert-publications/dto/advert-publication.dto'
import { AdvertModel, AdvertVersionEnum } from './advert.model'
import { CategoryModel } from './category.model'
import { TypeIdEnum, TypeModel } from './type.model'

export type AdvertPublicationsAttributes = {
  advertId: string
  scheduledAt: Date
  publishedAt: Date | null
  versionNumber: number
  pdfUrl?: string
}

export type AdvertPublicationsCreateAttributes = {
  advertId?: string
  scheduledAt: Date
  publishedAt?: Date | null
  versionNumber?: number
  pdfUrl?: string
}

@BaseTable({ tableName: LegalGazetteModels.ADVERT_PUBLICATION })
@DefaultScope(() => ({
  order: [['scheduledAt', 'ASC']],
}))
@Scopes(() => ({
  published: (query?: GetPublicationsQueryDto) => {
    const publicationWhereOptions: WhereOptions = {
      publishedAt: {
        [Op.ne]: null,
      },
    }

    if (!query) {
      return {
        where: publicationWhereOptions,
        include: [
          {
            model: AdvertModel.unscoped(),
            required: true,
            attributes: [
              'id',
              'title',
              'typeId',
              'categoryId',
              'publicationNumber',
              'createdBy',
              'legacyId',
            ],
            include: [{ model: TypeModel }, { model: CategoryModel }],
          },
        ],
        order: [['publishedAt', 'DESC']],
      }
    }

    if (query.dateFrom && query.dateTo) {
      Object.assign(publicationWhereOptions, {
        publishedAt: {
          [Op.between]: [query.dateFrom, query.dateTo],
        },
      })
    }

    if (query.dateFrom && !query.dateTo) {
      Object.assign(publicationWhereOptions, {
        publishedAt: {
          [Op.gte]: query.dateFrom,
        },
      })
    }

    if (!query.dateFrom && query.dateTo) {
      Object.assign(publicationWhereOptions, {
        publishedAt: {
          [Op.lte]: query.dateTo,
        },
      })
    }

    const advertWhereOptions: WhereOptions = {}

    if (query.advertId) {
      Object.assign(advertWhereOptions, {
        id: query.advertId,
      })
    }

    if (query.search) {
      if (query.search.length === 10 && !isNaN(Number(query.search))) {
        // If the search term is exactly 10 characters long and is a number, we assume it's a publication number
        Object.assign(advertWhereOptions, {
          publicationNumber: query.search,
        })
      } else {
        Object.assign(advertWhereOptions, {
          [Op.or]: {
            title: {
              [Op.iLike]: `%${query.search}%`,
            },
            publicationNumber: {
              [Op.iLike]: `%${query.search}%`,
            },
          },
        })
      }
    }

    if (query.typeId) {
      Object.assign(advertWhereOptions, {
        typeId: query.typeId,
      })
    }

    if (query.categoryId) {
      Object.assign(advertWhereOptions, {
        categoryId: {
          [Op.in]: query.categoryId,
        },
      })
    }

    return {
      where: publicationWhereOptions,
      include: [
        {
          model: AdvertModel.unscoped(),
          required: true,
          attributes: [
            'id',
            'title',
            'typeId',
            'categoryId',
            'publicationNumber',
            'createdBy',
          ],
          include: [{ model: TypeModel }, { model: CategoryModel }],
          where: advertWhereOptions,
        },
      ],
      order: [['publishedAt', 'DESC']],
    }
  },
}))
export class AdvertPublicationModel extends BaseModel<
  AdvertPublicationsAttributes,
  AdvertPublicationsCreateAttributes
> {
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => AdvertModel)
  advertId!: string

  @Column({ type: DataType.DATE, allowNull: false })
  scheduledAt!: Date

  @Column({ type: DataType.DATE })
  publishedAt!: Date | null

  @Column({ type: DataType.INTEGER, defaultValue: '1' })
  versionNumber!: number

  @Column({ field: 'pdf_url', allowNull: true })
  pdfUrl?: string

  @Column({ type: DataType.VIRTUAL })
  get isPublished(): boolean {
    return this.publishedAt !== null
  }

  @Column({ type: DataType.VIRTUAL })
  get versionLetter(): AdvertVersionEnum {
    const letter = String.fromCharCode(64 + this.versionNumber)

    if (
      Object.values(AdvertVersionEnum).includes(letter as AdvertVersionEnum)
    ) {
      return letter as AdvertVersionEnum
    }

    throw new Error('Invalid version letter')
  }

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel

  @BeforeCreate
  static async validate(model: AdvertPublicationModel) {
    const advert = await AdvertModel.unscoped().findByPkOrThrow(
      model.advertId,
      {
        attributes: ['id', 'typeId'],
      },
    )

    switch (advert.typeId) {
      case TypeIdEnum.DIVISION_MEETING: {
        if (model.versionNumber > 1) {
          throw new BadRequestException(
            'Division meeting adverts can only have one version',
          )
        }

        break
      }
      default: {
        if (model.versionNumber > 3) {
          throw new BadRequestException(
            'Max three versions are allowed for this advert type',
          )
        }
      }
    }
  }

  @BeforeBulkCreate
  static async testing(
    _instances: AdvertPublicationModel[],
    options: BulkCreateOptions,
  ) {
    options.individualHooks = true
  }

  static fromModel(model: AdvertPublicationModel): AdvertPublicationDto {
    return {
      id: model.id,
      advertId: model.advertId,
      scheduledAt: model.scheduledAt.toISOString(),
      publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
      version: model.versionLetter,
      isLegacy: model.advert?.legacyId ? true : false,
      pdfUrl: model.pdfUrl ? model.pdfUrl : null,
    }
  }

  fromModel(): AdvertPublicationDto {
    return AdvertPublicationModel.fromModel(this)
  }

  static fromModelToPublishedDto(
    model: AdvertPublicationModel,
  ): PublishedPublicationDto {
    if (!model.publishedAt) {
      throw new Error('Publication is not published')
    }

    if (!model.advert.publicationNumber) {
      throw new Error('Advert is not loaded')
    }

    return {
      id: model.id,
      advertId: model.advertId,
      publishedAt: model.publishedAt.toISOString(),
      version: model.versionLetter,
      category: model.advert.category.fromModel(),
      type: model.advert.type.fromModel(),
      title: model.advert.title,
      publicationNumber: model.advert.publicationNumber,
      createdBy: model.advert.createdBy,
      isLegacy: model.advert.legacyId ? true : false,
      pdfUrl: model.pdfUrl ? model.pdfUrl : null,
    }
  }

  fromModelToPublishedDto(): PublishedPublicationDto {
    return AdvertPublicationModel.fromModelToPublishedDto(this)
  }
}
