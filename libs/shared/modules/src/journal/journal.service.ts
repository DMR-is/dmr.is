import { Op } from 'sequelize'
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
import { generatePaging, sortAlphabetically } from '@dmr.is/utils'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { Audit } from '../decorators/audit.decorator'
import { HandleException } from '../decorators/handle-exception.decorator'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
  advertTypesMigrate,
} from '../helpers'
import { handleBadRequest } from '../lib/utils'
import { Result } from '../types/result'
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
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  @Audit()
  @HandleException()
  async create(model: Advert): Promise<Result<GetAdvertResponse>> {
    if (!model || !model.department) {
      this.logger.error('create, no model')
      return {
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
        },
      }
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
      return {
        ok: false,
        error: {
          code: 500,
          message: 'Internal server error',
        },
      }
    }

    return { ok: true, value: { advert: advertMigrate(newlyCreatedAd) } }
  }

  @Audit()
  @HandleException()
  async updateAdvert(model: Advert): Promise<Result<GetAdvertResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'updateAdvert',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
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
    return { ok: true, value: { advert: advertMigrate(ad[1][0]) } }
  }

  @Audit()
  @HandleException()
  async insertDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'insertDepartment',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
    }

    const dep = await this.advertDepartmentModel.create({
      title: model.title,
      slug: model.slug,
    })
    return { ok: true, value: { department: dep } }
  }

  @Audit()
  @HandleException()
  async updateDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    if (!model || !model.id) {
      return handleBadRequest({
        method: 'updateDepartment',
        reason: 'missing model or id',
        category: LOGGING_CATEGORY,
      })
    }
    const dep = await this.advertDepartmentModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )
    if (!dep) {
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find department<${model.id}>`,
        },
      }
    }
    return {
      ok: true,
      value: { department: advertDepartmentMigrate(dep[1][0]) },
    }
  }

  @Audit()
  @HandleException()
  async insertInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'insertInstitution',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
    }

    const inst = await this.advertInvolvedPartyModel.create({
      title: model.title,
      slug: model.slug,
    })

    return { ok: true, value: { institution: inst } }
  }

  @Audit()
  @HandleException()
  async updateInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    if (!model || !model.id) {
      return handleBadRequest({
        method: 'updateInstitution',
        reason: 'missing model or id',
        category: LOGGING_CATEGORY,
      })
    }
    const inst = await this.advertInvolvedPartyModel.update(
      { title: model.title, slug: model.slug },
      { where: { id: model.id }, returning: true },
    )
    if (!inst) {
      throw new NotFoundException()
    }
    return {
      ok: true,
      value: { institution: advertInvolvedPartyMigrate(inst[1][0]) },
    }
  }

  @Audit()
  @HandleException()
  async getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<Result<GetAdvertSignatureResponse>> {
    throw new Error('Method not implemented.')
  }

  @Audit()
  @HandleException()
  error(): void {
    throw new Error('Method not implemented.')
  }

  @Audit()
  @HandleException()
  async insertType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'insertType',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
    }

    const type = await this.advertTypeModel.create({
      title: model.title,
      slug: model.slug,
      departmentId: model.department?.id,
    })
    return { ok: true, value: { type: type } }
  }

  @Audit()
  @HandleException()
  async updateType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>> {
    if (!model || !model.id) {
      return handleBadRequest({
        method: 'updateType',
        reason: 'missing model or id',
        category: LOGGING_CATEGORY,
      })
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
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find type<${model.id}>`,
        },
      }
    }
    return { ok: true, value: { type: advertTypesMigrate(type[1][0]) } }
  }

  @Audit()
  @HandleException()
  async insertMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'insertMainCategory',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
    }
    const mainCategory = await this.advertMainCategoryModel.create({
      title: model.title,
      slug: model.slug,
      description: model.description,
    })
    return {
      ok: true,
      value: { mainCategory: advertMainCategoryMigrate(mainCategory) },
    }
  }

  @Audit()
  @HandleException()
  async updateMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    if (!model || !model.id) {
      return handleBadRequest({
        method: 'updateMainCategory',
        reason: 'missing model or id',
        category: LOGGING_CATEGORY,
      })
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
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find main category<${model.id}>`,
        },
      }
    }
    return {
      ok: true,
      value: { mainCategory: advertMainCategoryMigrate(mainCat[1][0]) },
    }
  }

  @Audit()
  @HandleException()
  async insertCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    if (!model) {
      return handleBadRequest({
        method: 'insertCategory',
        reason: 'missing model',
        category: LOGGING_CATEGORY,
      })
    }

    const category = await this.advertCategoryModel.create({
      title: model.title,
      slug: model.slug,
      mainCategoryID: model.mainCategory?.id,
    })
    return { ok: true, value: { category: advertCategoryMigrate(category) } }
  }

  @Audit()
  @HandleException()
  async updateCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    if (!model || !model.id) {
      return handleBadRequest({
        method: 'updateCategory',
        reason: 'missing model or id',
        category: LOGGING_CATEGORY,
      })
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
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find category<${model.id}>`,
        },
      }
    }
    return {
      ok: true,
      value: { category: advertCategoryMigrate(category[1][0]) },
    }
  }

  @Audit()
  @HandleException()
  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<Result<GetMainCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const mainCategories = await this.advertMainCategoryModel.findAndCountAll({
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

    return {
      ok: true,
      value: {
        mainCategories: mapped,
        paging: generatePaging(mapped, page, pageSize, mainCategories.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async getDepartment(id: string): Promise<Result<GetDepartmentResponse>> {
    if (!id) {
      return handleBadRequest({
        method: 'getDepartment',
        reason: 'missing id',
        category: LOGGING_CATEGORY,
      })
    }
    const department = await this.advertDepartmentModel.findOne({
      where: { id },
    })
    if (!department) {
      this.logger.warn('Department not found')
      return {
        ok: false,
        error: { code: 404, message: `Could not find department<${id}>` },
      }
    }

    return {
      ok: true,
      value: {
        department: advertDepartmentMigrate(department),
      },
    }
  }

  @Audit()
  @HandleException()
  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<Result<GetDepartmentsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const departments = await this.advertDepartmentModel.findAndCountAll({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: params?.search
        ? {
            title: { [Op.iLike]: `%${params?.search}%` },
          }
        : undefined,
    })

    const mapped = departments.rows.map((item) => advertDepartmentMigrate(item))

    return {
      ok: true,
      value: {
        departments: mapped,
        paging: generatePaging(mapped, page, pageSize, departments.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async getType(id: string): Promise<Result<GetAdvertTypeResponse>> {
    const type = await this.advertTypeModel.findOne<AdvertTypeDTO>({
      include: AdvertDepartmentDTO,
      where: {
        id: id,
      },
    })

    if (!type) {
      return {
        ok: false,
        error: { code: 404, message: `Could not find type<${id}>` },
      }
    }

    return { ok: true, value: { type: type } }
  }

  @Audit()
  @HandleException()
  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<Result<GetAdvertTypesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const query = ''

    const types = await this.advertTypeModel.findAndCountAll<AdvertTypeDTO>({
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
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    // we need more context on dev to understand what is happening
    if (types.count === 0 || types.rows.length === 0) {
      this.logger.warn('No types found', {
        category: LOGGING_CATEGORY,
        params: params,
        departmentsWhereParams: params?.department
          ? {
              slug: params?.department,
            }
          : undefined,
        query,
      })
    }

    const mapped = types.rows.map((item) => advertTypesMigrate(item))

    return {
      ok: true,
      value: {
        types: mapped.sort((a, b) => sortAlphabetically(a.title, b.title)),
        paging: generatePaging(mapped, page, pageSize, types.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async getInstitution(id: string): Promise<Result<GetInstitutionResponse>> {
    if (!id) {
      return handleBadRequest({
        method: 'getInstitution',
        reason: 'missing id',
        category: LOGGING_CATEGORY,
      })
    }
    const party = await this.advertInvolvedPartyModel.findOne({
      where: { id },
    })
    if (!party) {
      return {
        ok: false,
        error: { code: 404, message: `Could not find institution<${id}` },
      }
    }

    return {
      ok: true,
      value: {
        institution: advertInvolvedPartyMigrate(party),
      },
    }
  }

  @Audit()
  @HandleException()
  async getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<Result<GetInstitutionsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const parties = await this.advertInvolvedPartyModel.findAndCountAll({
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

    return {
      ok: true,
      value: {
        institutions: mapped,
        paging: generatePaging(mapped, page, pageSize, parties.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async getCategory(id: string): Promise<Result<GetCategoryResponse>> {
    if (!id) {
      return handleBadRequest({
        method: 'getCategory',
        reason: 'missing id',
        category: LOGGING_CATEGORY,
      })
    }
    const category = await this.advertCategoryModel.findOne({
      where: { id },
      include: AdvertMainCategoryDTO,
    })
    if (!category) {
      return {
        ok: false,
        error: { code: 404, message: `Could not find category<${id}>` },
      }
    }

    return {
      ok: true,
      value: { category: advertCategoryMigrate(category) },
    }
  }

  @Audit()
  @HandleException()
  async getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<Result<GetCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const categories = await this.advertCategoryModel.findAndCountAll({
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

    return {
      ok: true,
      value: {
        categories: mapped,
        paging: generatePaging(mapped, page, pageSize, categories.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async getAdvert(id: string): Promise<Result<GetAdvertResponse>> {
    if (!id) {
      return handleBadRequest({
        method: 'getAdvert',
        reason: 'missing id',
        category: LOGGING_CATEGORY,
      })
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
      return {
        ok: false,
        error: { code: 404, message: `Could not find advert<${id}>` },
      }
    }

    const ad = advertMigrate(advert)
    return {
      ok: true,
      value: {
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
      },
    }
  }

  @Audit()
  @HandleException()
  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<Result<GetAdvertsResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined
    const adverts = await this.advertModel.findAndCountAll({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: {
        [Op.and]: [
          searchCondition ? { subject: { [Op.iLike]: searchCondition } } : {},
        ],
      },
      include: [
        {
          model: AdvertTypeDTO,
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
    })

    const mapped = adverts.rows.map((item) => advertMigrate(item))

    const result: GetAdvertsResponse = {
      adverts: mapped,
      paging: generatePaging(mapped, page, pageSize, adverts.count),
    }

    return { ok: true, value: result }
  }
}
