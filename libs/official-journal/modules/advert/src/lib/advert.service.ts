import { Op, Sequelize, Transaction } from 'sequelize'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertAttachmentsModel,
  AdvertCategoriesModel,
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
  AdvertStatusEnum,
  AdvertStatusModel,
  AdvertTypeModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { CreateAdvert } from './dto/advert.dto'
import { GetAdvertResponse } from './dto/get-advert-response.dto'
import { GetAdvertsQueryParams } from './dto/get-adverts-query.dto'
import {
  GetAdvertsResponse,
  GetSimilarAdvertsResponse,
} from './dto/get-adverts-responses.dto'
import { UpdateAdvertBody } from './dto/update-advert-body.dto'
import { advertUpdateParametersMapper } from './mappers/advert-update-parameters.mapper'
import { advertMigrate } from './migrations/advert.migrate'
import { advertSimilarMigrate } from './migrations/advert-similar.migrate'
import { IAdvertService } from './advert.service.interface'
import { removeSubjectFromHtml } from './utils'

const LOGGING_CATEGORY = 'advert-service'
const LOGGING_CONTEXT = 'AdvertService'

@Injectable()
export class AdvertService implements IAdvertService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(AdvertCategoriesModel)
    private readonly advertCategoriesModel: typeof AdvertCategoriesModel,
    @InjectModel(AdvertStatusModel)
    private readonly advertStatusModel: typeof AdvertStatusModel,
    @InjectModel(CaseModel)
    private readonly caseModel: typeof CaseModel,
  ) {}

  @LogAndHandle()
  async getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const advert = await this.advertModel.findByPk(id, {
      include: [
        { model: AdvertTypeModel, include: [AdvertDepartmentModel] },
        AdvertDepartmentModel,
        AdvertStatusModel,
        AdvertInvolvedPartyModel,
        AdvertAttachmentsModel,
        AdvertCategoryModel,
        AdvertCorrectionModel,
      ],
    })

    if (!advert) {
      throw new NotFoundException(`Advert<${id}> not found`)
    }

    const ad = advertMigrate(advert)

    let html = advert.documentHtml
    if (advert.isLegacy) {
      try {
        html = removeSubjectFromHtml(html, advert.subject)
        html = dirtyClean(html as HTMLText)
      } catch {
        this.logger.warn("Dirty clean failed for advert's HTML", {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
          metadata: { advertId: id },
        })
        html = advert.documentHtml
      }
    }

    return ResultWrapper.ok({
      advert: {
        ...ad,
        document: {
          isLegacy: advert.isLegacy,
          html,
          pdfUrl: `${advert.documentPdfUrl}`,
        },
      },
    })
  }

  @LogAndHandle()
  async getSimilarAdverts(
    advertId: string,
    limit = 5,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>> {
    const originalAdvert = await this.advertModel.findByPk(advertId, {
      include: [
        { model: AdvertDepartmentModel, as: 'department' },
        { model: AdvertInvolvedPartyModel, as: 'involvedParty' },
        { model: AdvertCategoryModel, as: 'categories' },
        { model: AdvertTypeModel },
      ],
    })

    if (!originalAdvert) {
      throw new NotFoundException(`Advert with ID ${advertId} not found.`)
    }

    const departmentId = originalAdvert.department.id
    const involvedPartyId = originalAdvert.involvedParty.id
    const categoryIds = originalAdvert.categories?.map((c) => c.id) ?? []

    const similarAdverts = await this.advertModel.findAll({
      where: {
        id: {
          [Op.ne]: advertId,
        },
      },
      include: [
        {
          model: AdvertDepartmentModel,
          where: {
            id: {
              [Op.eq]: departmentId,
            },
          },
        },
        {
          model: AdvertInvolvedPartyModel,
          where: {
            id: {
              [Op.eq]: involvedPartyId,
            },
          },
        },
        AdvertAttachmentsModel,
        AdvertStatusModel,
        {
          model: AdvertTypeModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertCategoryModel,
          attributes: ['id', 'title', 'slug'],
          where: {
            id: {
              [Op.in]: categoryIds,
            },
          },
        },
      ],
      order: [
        [
          Sequelize.literal(`CASE
            WHEN "AdvertModel"."involved_party_id" = '${involvedPartyId}' THEN 2
            WHEN "AdvertModel"."department_id" = '${departmentId}' THEN 1
            ELSE 0 END`),
          'DESC',
        ],
      ],
      limit: limit,
    })

    const mapped = similarAdverts.map((item) => advertSimilarMigrate(item))

    return ResultWrapper.ok({
      adverts: mapped,
    })
  }

  @LogAndHandle()
  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined

    try {
      // Check if the search is for an internal case number
      const isearchingForInternalCaseNumber = /^\d{11}$/.test(
        params?.search ?? '',
      )
      if (isearchingForInternalCaseNumber) {
        const found = await this.caseModel.findOne({
          include: [
            {
              model: AdvertModel,
              include: [
                {
                  model: AdvertTypeModel,
                  as: 'type',
                  include: [
                    {
                      model: AdvertDepartmentModel,
                    },
                  ],
                },
                AdvertDepartmentModel,
                AdvertStatusModel,
                AdvertInvolvedPartyModel,
                AdvertAttachmentsModel,
                AdvertCategoryModel,
              ],
            },
          ],
          where: {
            caseNumber: params?.search,
          },
        })

        if (!found?.advert) {
          return ResultWrapper.ok({
            adverts: [],
            paging: generatePaging([], 1, pageSize, 1),
          })
        }

        const migrated = advertMigrate(found.advert)
        const paging = generatePaging([migrated], 1, pageSize, 1)

        return ResultWrapper.ok({
          adverts: [migrated],
          paging,
        })
      }
    } catch (error) {
      // do nothing, just continue.
    }
    const whereParams = {}
    if (params?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.gte]: params.dateFrom,
        },
      })
    }

    if (params?.dateTo) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.lte]: params.dateTo,
        },
      })
    }

    if (params?.dateTo && params?.dateFrom) {
      Object.assign(whereParams, {
        publicationDate: {
          [Op.between]: [params.dateFrom, params.dateTo],
        },
      })
    }

    if (params?.search) {
      Object.assign(whereParams, {
        [Op.or]: [
          {
            subject: { [Op.iLike]: searchCondition },
          },
          [
            Sequelize.where(
              Sequelize.literal(`CONCAT(serial_number, '/', publication_year)`),
              { [Op.iLike]: searchCondition },
            ),
          ],
        ],
      })
    }

    const adverts = await this.advertModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where: whereParams,
      attributes: {
        include: [
          ['publication_date', 'customPublicationDate'],
          ['serial_number', 'customSerialNumber'],
        ],
      },
      include: [
        {
          model: AdvertTypeModel,
          as: 'type',
          include: [
            {
              model: AdvertDepartmentModel,
            },
          ],
          where: params?.type
            ? {
                slug: params?.type,
              }
            : undefined,
        },
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                slug: params?.department,
              }
            : undefined,
        },
        AdvertStatusModel,
        {
          model: AdvertInvolvedPartyModel,
          where: params?.involvedParty
            ? {
                slug: params?.involvedParty,
              }
            : undefined,
        },
        AdvertAttachmentsModel,
        AdvertCategoryModel,
        {
          model: AdvertCategoryModel,
          where: params?.category
            ? {
                slug: params?.category,
              }
            : undefined,
        },
      ],
      order: [
        [Sequelize.literal('"customPublicationDate"'), 'DESC'],
        [Sequelize.literal('"customSerialNumber"'), 'DESC'],
      ],
    })

    const mapped = adverts.rows.map((item) => advertMigrate(item))

    const paging = generatePaging(mapped, page, pageSize, adverts.count)

    return ResultWrapper.ok({
      adverts: mapped,
      paging,
    })
  }
  @LogAndHandle({ logArgs: false })
  async create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    const id = uuid()

    const status = await this.advertStatusModel.findOne({
      where: { title: { [Op.eq]: AdvertStatusEnum.Published } },
    })

    if (!status) {
      this.logger.error('Advert status not found', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        metadata: { status: AdvertStatusEnum.Published },
      })
      throw new InternalServerErrorException('Advert status not found')
    }

    const publicationYear = new Date(model.publicationDate).getFullYear()

    const ad = await this.advertModel.create(
      {
        id: id,
        departmentId: model.departmentId,
        typeId: model.typeId,
        statusId: status.id,
        involvedPartyId: model.involvedPartyId,
        subject: model.subject,
        serialNumber: model.serial,
        publicationYear: publicationYear,
        publicationDate: model.publicationDate,
        signatureDate: model.signatureDate,
        documentHtml: model.content,
        documentPdfUrl: model.pdfUrl,
        isLegacy: false,
      },
      {
        transaction,
        returning: ['id'],
      },
    )

    await Promise.all(
      model.categories.map((id) => {
        this.advertCategoriesModel.create(
          {
            advert_id: ad.id,
            category_id: id,
          },
          { transaction },
        )
      }),
    )

    const advert = await this.advertModel.findByPk(ad.id, {
      include: [
        { model: AdvertTypeModel, include: [AdvertDepartmentModel] },
        AdvertDepartmentModel,
        AdvertStatusModel,
        AdvertInvolvedPartyModel,
        AdvertAttachmentsModel,
        AdvertCategoryModel,
      ],
      transaction,
    })

    if (!advert) {
      throw new InternalServerErrorException(`Advert<${ad.id}> not found`)
    }

    return ResultWrapper.ok({ advert: advertMigrate(advert) })
  }

  @LogAndHandle()
  async updateAdvert(
    advertId: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!body) {
      return ResultWrapper.err({
        message: 'No body provided',
        code: 400,
      })
    }

    const updateParams = advertUpdateParametersMapper(body)

    await this.advertModel.update(updateParams, {
      where: { id: advertId },
    })

    const advert = await this.getAdvert(advertId)

    if (!advert.result.ok) {
      this.logger.error('Failed to get updated advert', {
        category: 'JournalService',
        metadata: { advertId },
      })

      return ResultWrapper.err({
        message: 'Failed to get updated advert',
        code: 500,
      })
    }

    return ResultWrapper.ok({ advert: advert.result.value.advert })
  }
}
