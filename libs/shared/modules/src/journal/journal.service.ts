import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertType,
  Category,
  CreateAdvert,
  DefaultSearchParams,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypeResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  Institution,
  MainCategory,
  UpdateAdvertBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { advertUpdateParametersMapper } from './mappers/advert-update-parameters.mapper'
import { IJournalService } from './journal.service.interface'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
  advertTypesMigrate,
} from './migrations'
import {
  AdvertAttachmentsModel,
  AdvertCategoriesModel,
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertMainCategoryModel,
  AdvertModel,
  AdvertStatusModel,
  AdvertTypeModel,
} from './models'

const DEFAULT_PAGE_SIZE = 20
@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(AdvertModel)
    private advertModel: typeof AdvertModel,

    @InjectModel(AdvertTypeModel)
    private advertTypeModel: typeof AdvertTypeModel,

    @InjectModel(AdvertMainCategoryModel)
    private advertMainCategoryModel: typeof AdvertMainCategoryModel,

    @InjectModel(AdvertDepartmentModel)
    private advertDepartmentModel: typeof AdvertDepartmentModel,
    @InjectModel(AdvertInvolvedPartyModel)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,
    @InjectModel(AdvertCategoryModel)
    private advertCategoryModel: typeof AdvertCategoryModel,
    @InjectModel(AdvertStatusModel)
    private advertStatusModel: typeof AdvertStatusModel /* @InjectModel(AdvertStatusHistoryModel)
    private advertStatusHistoryModel: typeof AdvertStatusHistoryModel,*/,

    @InjectModel(AdvertCategoriesModel)
    private advertCategoriesModel: typeof AdvertCategoriesModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  @LogAndHandle({ logArgs: false })
  async create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    const publicationYear = model.publicationDate.getFullYear()
    const localId = model.id ? model.id : uuid()

    const ad = await this.advertModel.create(
      {
        id: localId,
        departmentId: model.departmentId,
        typeId: model.typeId,
        statusId: model.statusId,
        involvedPartyId: model.involvedPartyId,
        subject: model.subject,
        serialNumber: model.publicationNumber,
        publicationYear: publicationYear,
        publicationDate: model.publicationDate,
        signatureDate: model.signatureDate,
        documentHtml: model.documentHtml,
        documentPdfUrl: model.documentPdfUrl,
        isLegacy: model.isLegacy,
      },
      {
        transaction,
      },
    )

    const categories = await this.advertCategoryModel.findAll({
      where: {
        id: model.categoryIds,
      },
      transaction,
    })

    await Promise.all(
      categories.map((c) => {
        this.advertCategoriesModel.create(
          {
            advert_id: ad.id,
            category_id: c.id,
          },
          { transaction },
        )
      }),
    )

    const advert = await this.advertModel.findByPk(ad.id, {
      include: [
        AdvertTypeModel,
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

  @LogAndHandle()
  async insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const dep = await this.advertDepartmentModel.create({
      title: model.title,
      slug: model.slug,
    })

    return ResultWrapper.ok({ department: advertDepartmentMigrate(dep) })
  }

  @LogAndHandle()
  async updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const dep = await this.advertDepartmentModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )

    if (!dep) {
      throw new NotFoundException(`Department<${model.id}> not found`)
    }

    return ResultWrapper.ok({
      department: advertDepartmentMigrate(dep[1][0]),
    })
  }

  @LogAndHandle()
  async insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const inst = await this.advertInvolvedPartyModel.create({
      title: model.title,
      slug: model.slug,
    })

    return ResultWrapper.ok({ institution: advertInvolvedPartyMigrate(inst) })
  }

  @LogAndHandle()
  async updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const inst = await this.advertInvolvedPartyModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )

    if (!inst) {
      throw new NotFoundException(`Institution<${model.id}> not found`)
    }

    return ResultWrapper.ok({
      institution: advertInvolvedPartyMigrate(inst[1][0]),
    })
  }

  @LogAndHandle()
  async getSignatures(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>> {
    throw new NotImplementedException()
  }

  @LogAndHandle()
  error(): void {
    throw new NotImplementedException()
  }

  @LogAndHandle()
  async insertType(
    model: AdvertType,
  ): Promise<ResultWrapper<GetAdvertTypeResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const type = await this.advertTypeModel.create({
      title: model.title,
      slug: model.slug,
      departmentId: model.department?.id,
    })

    return ResultWrapper.ok({ type: advertTypesMigrate(type) })
  }

  @LogAndHandle()
  async updateType(
    model: AdvertType,
  ): Promise<ResultWrapper<GetAdvertTypeResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const type = await this.advertTypeModel.update(
      {
        title: model.title,
        slug: model.slug,
        departmentId: model.department?.id,
      },
      { where: { id: model.id }, returning: true },
    )

    if (!type) {
      throw new NotFoundException(`Type<${model.id}> not found`)
    }

    return ResultWrapper.ok({ type: advertTypesMigrate(type[1][0]) })
  }

  @LogAndHandle()
  async insertMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const mainCategory = await this.advertMainCategoryModel.create({
      title: model.title,
      slug: model.slug,
      description: model.description,
    })

    return ResultWrapper.ok({
      mainCategory: advertMainCategoryMigrate(mainCategory),
    })
  }

  @LogAndHandle()
  async updateMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const mainCat = await this.advertMainCategoryModel.update(
      {
        title: model.title,
        description: model.description,
        slug: model.slug,
      },
      { where: { id: model.id }, returning: true },
    )

    if (!mainCat) {
      throw new NotFoundException(`Main category<${model.id}> not found`)
    }

    return ResultWrapper.ok({
      mainCategory: advertMainCategoryMigrate(mainCat[1][0]),
    })
  }

  @LogAndHandle()
  async insertCategory(
    model: Category,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.create(
      {
        title: model.title,
        slug: model.slug,
        mainCategoryID: model.mainCategory?.id,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  async updateCategory(
    model: Category,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!model || !model.id) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.update(
      {
        title: model.title,
        slug: model.slug,
        mainCategoryID: model.mainCategory?.id,
      },
      { where: { id: model.id }, returning: true },
    )

    if (!category) {
      throw new NotFoundException(`Category<${model.id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category[1][0]) })
  }

  @LogAndHandle()
  async getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const mainCategories = await this.advertMainCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: params?.search
        ? {
            title: { [Op.iLike]: `%${params?.search}%` },
          }
        : undefined,
    })

    const mapped = mainCategories.rows.map((item) =>
      advertMainCategoryMigrate(item),
    )
    const paging = generatePaging(mapped, page, pageSize, mainCategories.count)

    return ResultWrapper.ok({
      mainCategories: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getDepartment(
    id: string,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const department = await this.advertDepartmentModel.findOne({
      where: { id },
    })

    if (!department) {
      throw new NotFoundException(`Department<${id}> not found`)
    }

    return ResultWrapper.ok({ department: advertDepartmentMigrate(department) })
  }

  @LogAndHandle()
  async getDepartments(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {
      slug: {
        [Op.like]: '%deild%',
      },
    }
    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    const departments = await this.advertDepartmentModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: whereParams,
    })

    const mapped = departments.rows.map((item) => advertDepartmentMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, departments.count)

    return ResultWrapper.ok({
      departments: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getType(id: string): Promise<ResultWrapper<GetAdvertTypeResponse>> {
    const type = await this.advertTypeModel.findOne<AdvertTypeModel>({
      include: AdvertDepartmentModel,
      where: {
        id: id,
      },
    })

    if (!type) {
      throw new NotFoundException(`Type<${id}> not found`)
    }

    return ResultWrapper.ok({ type: advertTypesMigrate(type) })
  }

  @LogAndHandle()
  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<ResultWrapper<GetAdvertTypesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const types = await this.advertTypeModel.findAndCountAll<AdvertTypeModel>({
      distinct: true,
      include: [
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                id: params?.department,
              }
            : undefined,
        },
      ],
      order: [['title', 'ASC']],
      where: params?.search
        ? { title: { [Op.iLike]: `%${params.search}%` } }
        : {},
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    const mapped = types.rows.map((item) => advertTypesMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, types.count)

    return ResultWrapper.ok({
      types: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getInstitution(
    id: string,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const party = await this.advertInvolvedPartyModel.findOne({
      where: { id },
    })
    if (!party) {
      throw new NotFoundException(`Institution<${id}> not found`)
    }

    return ResultWrapper.ok({ institution: advertInvolvedPartyMigrate(party) })
  }

  @LogAndHandle()
  async getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const parties = await this.advertInvolvedPartyModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: params?.search
        ? {
            title: { [Op.iLike]: `%${params?.search}%` },
          }
        : undefined,
    })

    const mapped = parties.rows.map((item) => advertInvolvedPartyMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, parties.count)

    return ResultWrapper.ok({
      institutions: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.findOne({
      where: { id },
      include: AdvertMainCategoryModel,
    })

    if (!category) {
      throw new NotFoundException(`Category<${id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  async getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const categories = await this.advertCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: params?.search
        ? {
            title: { [Op.iLike]: `%${params?.search}%` },
          }
        : undefined,
      include: AdvertMainCategoryModel,
    })

    const mapped = categories.rows.map((item) => advertCategoryMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, categories.count)

    return ResultWrapper.ok({
      categories: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const advert = await this.advertModel.findByPk(id, {
      include: [
        AdvertTypeModel,
        AdvertDepartmentModel,
        AdvertStatusModel,
        AdvertInvolvedPartyModel,
        AdvertAttachmentsModel,
        AdvertCategoryModel,
      ],
    })

    if (!advert) {
      throw new NotFoundException(`Advert<${id}> not found`)
    }

    const ad = advertMigrate(advert)
    return ResultWrapper.ok({
      advert: {
        ...ad,
        document: {
          isLegacy: advert.isLegacy,
          html: advert.isLegacy
            ? dirtyClean(advert.documentHtml as HTMLText)
            : advert.documentHtml,
          pdfUrl: advert.documentPdfUrl,
        },
      },
    })
  }

  @LogAndHandle()
  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined

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

    if (params?.search) {
      Object.assign(whereParams, {
        subject: { [Op.iLike]: searchCondition },
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
}
