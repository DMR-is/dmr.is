import { Transform } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
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
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { AdvertDto, AdvertModel } from './advert.model'
import { CategoryDto, CategoryModel } from './category.model'
import { TypeDto, TypeIdEnum, TypeModel } from './type.model'

export enum AdvertVersionEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

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
        typeId: { [Op.eq]: query.typeId },
      })
    }

    if (query.categoryId) {
      Object.assign(advertWhereOptions, {
        categoryId: {
          [Op.eq]: query.categoryId,
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
  @ApiProperty({ type: String })
  advertId!: string

  @Column({ type: DataType.DATE, allowNull: false })
  @ApiProperty({ type: String })
  scheduledAt!: Date

  @Column({ type: DataType.DATE })
  @ApiProperty({ type: String, required: false })
  publishedAt!: Date | null

  @Column({ type: DataType.INTEGER, defaultValue: '1' })
  @ApiProperty({ type: Number })
  versionNumber!: number

  @Column({ field: 'pdf_url', allowNull: true })
  @ApiProperty({ type: String, required: false })
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
      publishedAt: model.publishedAt?.toISOString(),
      version: model.versionLetter,
      isLegacy: model.advert?.legacyId ? true : false,
      pdfUrl: model?.pdfUrl,
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
      ...this.fromModel(model),
      category: model.advert.category.fromModel(),
      type: model.advert.type.fromModel(),
      title: model.advert.title,
      publishedAt: model.publishedAt.toISOString(),
      publicationNumber: model.advert.publicationNumber,
      createdBy: model.advert.createdBy,
    }
  }

  fromModelToPublishedDto(): PublishedPublicationDto {
    return AdvertPublicationModel.fromModelToPublishedDto(this)
  }
}

export class AdvertPublicationDto extends PickType(AdvertPublicationModel, [
  'id',
  'advertId',
  'pdfUrl',
] as const) {
  @ApiProperty({ type: String })
  scheduledAt!: string

  @ApiProperty({ type: String, required: false })
  publishedAt?: string

  @ApiProperty({ type: Boolean })
  isLegacy!: boolean

  @ApiProperty({ enum: AdvertVersionEnum, enumName: 'AdvertVersionEnum' })
  version!: AdvertVersionEnum
}

export class AdvertPublicationDetailedDto {
  @ApiProperty({ type: () => AdvertPublicationDto })
  publication!: AdvertPublicationDto

  @ApiProperty({ type: () => AdvertDto })
  advert!: AdvertDto

  @ApiProperty({ type: String })
  html!: string
}

export class PublishedPublicationDto extends OmitType(AdvertPublicationDto, [
  'scheduledAt',
  'publishedAt',
] as const) {
  @ApiProperty({ type: String })
  publishedAt!: string

  @ApiProperty({ type: TypeDto })
  type!: TypeDto

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  publicationNumber!: string

  @ApiProperty({ type: String })
  createdBy!: string
}

export class UpdateAdvertPublicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string
}

export class GetPublicationsDto {
  @ApiProperty({ type: [PublishedPublicationDto] })
  publications!: PublishedPublicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetRelatedPublicationsDto extends PickType(GetPublicationsDto, [
  'publications',
] as const) {}

export class GetPublicationsQueryDto extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  advertId?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  typeId?: string

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryId?: string[]

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  pdfUrl?: string
}
