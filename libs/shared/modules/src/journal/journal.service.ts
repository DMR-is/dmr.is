import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogMethod, HandleException } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Advert,
  AdvertType,
  Category,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypeResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  Institution,
  MainCategory,
} from '@dmr.is/shared/dto'
import { GenericError, ResultWrapper } from '@dmr.is/types'
import { generatePaging, sortAlphabetically } from '@dmr.is/utils'

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

import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
  advertTypesMigrate,
} from '../helpers'
import { IJournalService } from './journal.service.interface'
import {
  AdvertAttachmentsDTO,
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertMainCategoryDTO,
  AdvertStatusDTO,
  AdvertTypeDTO,
} from './models'

const LOGGING_CATEGORY = 'JournalService'
const DEFAULT_PAGE_SIZE = 20
@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(AdvertDTO)
    private advertModel: typeof AdvertDTO,

    @InjectModel(AdvertTypeDTO)
    private advertTypeModel: typeof AdvertTypeDTO,

    @InjectModel(AdvertMainCategoryDTO)
    private advertMainCategoryModel: typeof AdvertMainCategoryDTO,

    @InjectModel(AdvertDepartmentDTO)
    private advertDepartmentModel: typeof AdvertDepartmentDTO,
    @InjectModel(AdvertInvolvedPartyDTO)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyDTO,
    @InjectModel(AdvertCategoryDTO)
    private advertCategoryModel: typeof AdvertCategoryDTO,
    @InjectModel(AdvertStatusDTO)
    private advertStatusModel: typeof AdvertStatusDTO /* @InjectModel(AdvertStatusHistoryDTO)
    private advertStatusHistoryModel: typeof AdvertStatusHistoryDTO,*/,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  @LogMethod()
  @HandleException()
  async create(model: Advert): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!model || !model.department) {
      throw new BadRequestException()
    }

    const ad = await this.advertModel.create(
      {
        departmentId: model.department?.id,
        typeId: model.type?.id,
        subject: model.subject,
        serialNumber: model.publicationNumber?.number,
        publicationYear: model.publicationNumber?.year,
        signatureDate: model.signatureDate,
        publicationDate: model.publicationDate,
        documentHtml: model.document.html,
        documentPdfUrl: model.document.pdfUrl,
        isLegacy: model.document.isLegacy,
        involvedPartyId: model.involvedParty?.id,
        statusId: model.status,
      },
      {
        returning: ['id'],
      },
    )

    const newlyCreatedAd = await this.advertModel.findByPk(ad.id, {
      include: [
        AdvertTypeDTO,
        AdvertDepartmentDTO,
        AdvertStatusDTO,
        AdvertInvolvedPartyDTO,
        AdvertAttachmentsDTO,
        AdvertCategoryDTO,
      ],
    })

    if (!newlyCreatedAd) {
      throw new InternalServerErrorException()
    }

    return ResultWrapper.ok({ advert: advertMigrate(newlyCreatedAd) })
  }

  @LogMethod()
  @HandleException()
  async updateAdvert(model: Advert): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const ad = await this.advertModel.update(
      {
        title: model.title,
        departmentId: model.department?.id,
        typeId: model.type?.id,
        subject: model.subject,
        serialNumber: model.publicationNumber?.number,
        publicationYear: model.publicationNumber?.year,
        signatureDate: model.signatureDate,
        publicationDate: model.publicationDate,
        documentHtml: model.document.html,
        documentPdfUrl: model.document.pdfUrl,
        isLegacy: model.document.isLegacy,
        attachments: model.attachments,
        involvedPartyId: model.involvedParty?.id,
        status: model.status,
      },
      { where: { id: model.id }, returning: true },
    )

    return ResultWrapper.ok({ advert: advertMigrate(ad[1][0]) })
  }

  @LogMethod()
  @HandleException()
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find department<${model.id}>`)
    }

    return ResultWrapper.ok({
      department: advertDepartmentMigrate(dep[1][0]),
    })
  }

  @LogMethod()
  @HandleException()
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find institution<${model.id}>`)
    }

    return ResultWrapper.ok({
      institution: advertInvolvedPartyMigrate(inst[1][0]),
    })
  }

  @LogMethod()
  @HandleException()
  async getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>> {
    throw new NotImplementedException()
  }

  @LogMethod()
  @HandleException()
  error(): void {
    throw new NotImplementedException()
  }

  @LogMethod()
  @HandleException()
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find type<${model.id}>`)
    }

    return ResultWrapper.ok({ type: advertTypesMigrate(type[1][0]) })
  }

  @LogMethod()
  @HandleException()
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find main category<${model.id}>`)
    }

    return ResultWrapper.ok({
      mainCategory: advertMainCategoryMigrate(mainCat[1][0]),
    })
  }

  @LogMethod()
  @HandleException()
  async insertCategory(
    model: Category,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.create({
      title: model.title,
      slug: model.slug,
      mainCategoryID: model.mainCategory?.id,
    })

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find category<${model.id}>`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category[1][0]) })
  }

  @LogMethod()
  @HandleException()
  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find department<${id}>`)
    }

    return ResultWrapper.ok({ department: advertDepartmentMigrate(department) })
  }

  @LogMethod()
  @HandleException()
  async getDepartments(
    params?: GetDepartmentsQueryParams,
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

  @LogMethod()
  @HandleException()
  async getType(id: string): Promise<ResultWrapper<GetAdvertTypeResponse>> {
    const type = await this.advertTypeModel.findOne<AdvertTypeDTO>({
      include: AdvertDepartmentDTO,
      where: {
        id: id,
      },
    })

    if (!type) {
      throw new NotFoundException(`Could not find type<${id}>`)
    }

    return ResultWrapper.ok({ type: advertTypesMigrate(type) })
  }

  @LogMethod()
  @HandleException()
  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<ResultWrapper<GetAdvertTypesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const types = await this.advertTypeModel.findAndCountAll<AdvertTypeDTO>({
      distinct: true,
      include: [
        {
          model: AdvertDepartmentDTO,
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

  @LogMethod()
  @HandleException()
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
      throw new NotFoundException(`Could not find institution<${id}>`)
    }

    return ResultWrapper.ok({ institution: advertInvolvedPartyMigrate(party) })
  }

  @LogMethod()
  @HandleException()
  async getInstitutions(
    params?: GetInstitutionsQueryParams,
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

  @LogMethod()
  @HandleException()
  async getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.findOne({
      where: { id },
      include: AdvertMainCategoryDTO,
    })

    if (!category) {
      throw new NotFoundException(`Could not find category<${id}>`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogMethod()
  @HandleException()
  async getCategories(
    params?: GetCategoriesQueryParams,
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
      include: AdvertMainCategoryDTO,
    })

    const mapped = categories.rows.map((item) => advertCategoryMigrate(item))
    const paging = generatePaging(mapped, page, pageSize, categories.count)

    return ResultWrapper.ok({
      categories: mapped,
      paging,
    })
  }

  @LogMethod()
  @HandleException()
  async getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>> {
    if (!id) {
      throw new BadRequestException()
    }
    const advert = await this.advertModel.findByPk(id, {
      include: [
        AdvertTypeDTO,
        AdvertDepartmentDTO,
        AdvertStatusDTO,
        AdvertInvolvedPartyDTO,
        AdvertAttachmentsDTO,
        AdvertCategoryDTO,
      ],
    })

    if (!advert) {
      throw new NotFoundException(`Could not find advert<${id}>`)
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

  @LogMethod()
  @HandleException()
  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined
    const adverts = await this.advertModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where: {
        [Op.and]: [
          searchCondition ? { subject: { [Op.iLike]: searchCondition } } : {},
        ],
      },
      include: [
        {
          model: AdvertTypeDTO,
          as: 'type',
          where: params?.type
            ? {
                slug: params?.type,
              }
            : undefined,
        },
        {
          model: AdvertDepartmentDTO,
          where: params?.department
            ? {
                slug: params?.department,
              }
            : undefined,
        },
        AdvertStatusDTO,
        {
          model: AdvertInvolvedPartyDTO,
          where: params?.involvedParty
            ? {
                slug: params?.involvedParty,
              }
            : undefined,
        },
        AdvertAttachmentsDTO,
        AdvertCategoryDTO,
        {
          model: AdvertCategoryDTO,
          where: params?.category
            ? {
                slug: params?.category,
              }
            : undefined,
        },
      ],
      order: [
        // [{ model: AdvertTypeDTO, as: 'type' }, 'title', 'ASC'],
        ['publicationDate', 'DESC'],
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
