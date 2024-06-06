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
import { generatePaging } from '@dmr.is/utils'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
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
  typesParameters,
} from '../helpers'
import { handleException } from '../lib/utils'
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
  async create(model: Advert): Promise<Result<GetAdvertResponse>> {
    this.logger.info('create', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('create, no model')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const ad = await this.advertModel.create({
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
      })
      return { ok: true, value: { advert: advertMigrate(ad) } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in create',
        method: 'create',
        info: {
          model,
        },
      })
    }
  }
  async updateAdvert(model: Advert): Promise<Result<GetAdvertResponse>> {
    this.logger.info('updateAdvert', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in updateAdvert')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
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
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateAdvert',
        method: 'updateAdvert',
        info: {
          model,
        },
      })
    }
  }
  async insertDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    this.logger.info('insertDepartment', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in insertDepartment')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }

    try {
      const dep = await this.advertDepartmentModel.create({
        title: model.title,
        slug: model.slug,
      })
      return { ok: true, value: { department: dep } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in insertDepartment',
        method: 'insertDepartment',
        info: {
          model,
        },
      })
    }
  }
  async updateDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    this.logger.info('updateDepartment', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model || !model.id) {
      this.logger.error('No model or id in updateDepartment')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const dep = await this.advertDepartmentModel.update(
        { title: model.title, slug: model.slug },
        { where: { id: model.id }, returning: true },
      )
      if (!dep) {
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find department<${model.id}>`,
          },
        })
      }
      return {
        ok: true,
        value: { department: advertDepartmentMigrate(dep[1][0]) },
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateDepartment',
        method: 'updateDepartment',
        info: {
          model,
        },
      })
    }
  }
  async insertInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    this.logger.info('insertInstitution', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in insertInstitution')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }

    try {
      const inst = await this.advertInvolvedPartyModel.create({
        title: model.title,
        slug: model.slug,
      })

      return { ok: true, value: { institution: inst } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in insertInstitution',
        method: 'insertInstitution',
        info: {
          model,
        },
      })
    }
  }
  async updateInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    this.logger.info('updateInstitution', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model || !model.id) {
      this.logger.error('No model or id in updateInstitution')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
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
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateInstitution',
        method: 'updateInstitution',
        info: {
          model,
        },
      })
    }
  }
  async getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<Result<GetAdvertSignatureResponse>> {
    this.logger.info('getSignatures', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    throw new Error('Method not implemented.')
  }
  error(): void {
    throw new Error('Method not implemented.')
  }
  async insertType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>> {
    this.logger.info('insertType', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in insertType')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }

    try {
      const type = await this.advertTypeModel.create({
        title: model.title,
        slug: model.slug,
        departmentId: model.department?.id,
      })
      return Promise.resolve({ ok: true, value: { type: type } })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in insertType',
        method: 'insertType',
        info: {
          model,
        },
      })
    }
  }
  async updateType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>> {
    this.logger.info('updateType', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model || !model.id) {
      this.logger.error('No model or id in updateMainCategory')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const type = await this.advertTypeModel.update(
        {
          title: model.title,
          slug: model.slug,
          departmentId: model.department?.id,
        },
        { where: { id: model.id }, returning: true },
      )
      if (!type) {
        throw new NotFoundException()
      }
      return { ok: true, value: { type: advertTypesMigrate(type[1][0]) } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateType',
        method: 'updateType',
        info: {
          model,
        },
      })
    }
  }
  async insertMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    this.logger.info('insertMainCategory', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in insertMainCategory')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const mainCategory = await this.advertMainCategoryModel.create({
        title: model.title,
        slug: model.slug,
        description: model.description,
      })
      return {
        ok: true,
        value: { mainCategory: advertMainCategoryMigrate(mainCategory) },
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in insertMainCategory',
        method: 'insertMainCategory',
        info: {
          model,
        },
      })
    }
  }

  async updateMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    this.logger.info('updateMainCategory', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model || !model.id) {
      this.logger.error('No model or id in updateMainCategory')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const mainCat = await this.advertMainCategoryModel.update(
        {
          title: model.title,
          description: model.description,
          slug: model.slug,
        },
        { where: { id: model.id }, returning: true },
      )
      if (!mainCat) {
        throw new NotFoundException()
      }
      return {
        ok: true,
        value: { mainCategory: advertMainCategoryMigrate(mainCat[1][0]) },
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateMainCategory',
        method: 'updateMainCategory',
        info: {
          model,
        },
      })
    }
  }

  async insertCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    this.logger.info('insertCategory', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model) {
      this.logger.error('No model in insertCategory')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const category = await this.advertCategoryModel.create({
        title: model.title,
        slug: model.slug,
        mainCategoryID: model.mainCategory?.id,
      })
      return { ok: true, value: { category: advertCategoryMigrate(category) } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in insertCategory',
        method: 'insertCategory',
        info: {
          model,
        },
      })
    }
  }

  async updateCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    this.logger.info('updateCategory', {
      category: LOGGING_CATEGORY,
      model,
    })
    if (!model || !model.id) {
      this.logger.error('No model or id in updateCategory')
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const category = await this.advertCategoryModel.update(
        {
          title: model.title,
          slug: model.slug,
          mainCategoryID: model.mainCategory?.id,
        },
        { where: { id: model.id }, returning: true },
      )
      if (!category) {
        throw new NotFoundException()
      }
      return {
        ok: true,
        value: { category: advertCategoryMigrate(category[1][0]) },
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in updateCategory',
        method: 'updateCategory',
        info: {
          model,
        },
      })
    }
  }

  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<Result<GetMainCategoriesResponse>> {
    this.logger.info('getMainCategories', {
      category: LOGGING_CATEGORY,
      params,
    })
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
      const mainCategories = await this.advertMainCategoryModel.findAndCountAll(
        {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          where: params?.search
            ? {
                title: { [Op.iLike]: `%${params?.search}%` },
              }
            : undefined,
        },
      )

      const mapped = mainCategories.rows.map((item) =>
        advertMainCategoryMigrate(item),
      )

      return Promise.resolve({
        ok: true,
        value: {
          mainCategories: mapped,
          paging: generatePaging(mapped, page, pageSize, mainCategories.count),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getMainCategories',
        method: 'getMainCategories',
        info: {
          params,
        },
      })
    }
  }

  async getDepartment(id: string): Promise<Result<GetDepartmentResponse>> {
    this.logger.info('getDepartment', {
      category: LOGGING_CATEGORY,
      id,
    })
    try {
      if (!id) {
        this.logger.error('No id present in getDepartment')
        return Promise.resolve({
          ok: false,
          error: {
            code: 400,
            message: 'Bad request',
            category: LOGGING_CATEGORY,
          },
        })
      }
      const department = await this.advertDepartmentModel.findOne({
        where: { id },
      })
      if (!department) {
        this.logger.warn('Department not found')
        return Promise.resolve({
          ok: false,
          error: { code: 404, message: `Could not find department<${id}>` },
        })
      }

      return Promise.resolve({
        ok: true,
        value: {
          department: advertDepartmentMigrate(department),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getDepartment',
        method: 'getDepartment',
        info: {
          id,
        },
      })
    }
  }

  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<Result<GetDepartmentsResponse>> {
    this.logger.info('getDepartments', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      const departments = await this.advertDepartmentModel.findAndCountAll({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
      })

      const mapped = departments.rows.map((item) =>
        advertDepartmentMigrate(item),
      )

      return Promise.resolve({
        ok: true,
        value: {
          departments: mapped,
          paging: generatePaging(mapped, page, pageSize, departments.count),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getDepartments',
        method: 'getDepartments',
        info: {
          params,
        },
      })
    }
  }

  async getType(id: string): Promise<Result<GetAdvertTypeResponse>> {
    this.logger.info('getType', {
      category: LOGGING_CATEGORY,
      id,
    })
    try {
      const type = await this.advertTypeModel.findOne<AdvertTypeDTO>({
        include: AdvertDepartmentDTO,
        where: {
          id: id,
        },
      })

      if (!type) {
        this.logger.warn('Type not found')
        return Promise.resolve({
          ok: false,
          error: { code: 404, message: `Could not find type<${id}>` },
        })
      }

      return { ok: true, value: { type: type } }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getType',
        method: 'getType',
        info: {
          id,
        },
      })
    }
  }

  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<Result<GetAdvertTypesResponse>> {
    this.logger.info('getTypes', {
      category: LOGGING_CATEGORY,
      params,
    })
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      const whereParams = typesParameters(params)

      let query = ''

      const types = await this.advertTypeModel.findAndCountAll<AdvertTypeDTO>({
        logging(sql) {
          query = sql
        },
        include: [
          {
            model: AdvertDepartmentDTO,
            where: params?.department
              ? {
                  slug: params?.department,
                }
              : undefined,
          },
        ],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: whereParams,
      })

      // we need more context on dev to understand what is happening
      if (types.count === 0) {
        this.logger.warn('No types found', {
          category: LOGGING_CATEGORY,
          params: params,
          typesWhereParams: whereParams,
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
          types: mapped,
          paging: generatePaging(mapped, page, pageSize, types.count),
        },
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getTypes',
        method: 'getTypes',
        info: {
          params,
        },
      })
    }
  }

  async getInstitution(id: string): Promise<Result<GetInstitutionResponse>> {
    this.logger.info('getInstitution', {
      category: LOGGING_CATEGORY,
      id,
    })
    try {
      if (!id) {
        this.logger.error('No id present in getInstitution')
        return Promise.resolve({
          ok: false,
          error: {
            code: 400,
            message: 'Bad request',
            category: LOGGING_CATEGORY,
          },
        })
      }
      const party = await this.advertInvolvedPartyModel.findOne({
        where: { id },
      })
      if (!party) {
        return Promise.resolve({
          ok: false,
          error: { code: 404, message: `Could not find institution<${id}` },
        })
      }

      return Promise.resolve({
        ok: true,
        value: {
          institution: advertInvolvedPartyMigrate(party),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getInstitution',
        method: 'getInstitution',
        info: {
          id,
        },
      })
    }
  }

  async getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<Result<GetInstitutionsResponse>> {
    this.logger.info('getInstitutions', {
      category: LOGGING_CATEGORY,
      params,
    })
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      const parties = await this.advertInvolvedPartyModel.findAndCountAll({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
      })

      const mapped = parties.rows.map((item) =>
        advertInvolvedPartyMigrate(item),
      )

      return Promise.resolve({
        ok: true,
        value: {
          institutions: mapped,
          paging: generatePaging(mapped, page, pageSize, parties.count),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getInstitutions',
        method: 'getInstitutions',
        info: {
          params,
        },
      })
    }
  }

  async getCategory(id: string): Promise<Result<GetCategoryResponse>> {
    this.logger.info('getCategory', {
      category: LOGGING_CATEGORY,
      id,
    })
    if (!id) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 400,
          message: 'Bad request',
          category: LOGGING_CATEGORY,
        },
      })
    }
    try {
      const category = await this.advertCategoryModel.findOne({
        where: { id },
        include: AdvertMainCategoryDTO,
      })
      if (!category) {
        return Promise.resolve({
          ok: false,
          error: { code: 404, message: `Could not find category<${id}>` },
        })
      }

      return Promise.resolve({
        ok: true,
        value: { category: advertCategoryMigrate(category) },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getCategory',
        method: 'getCategory',
        info: {
          id,
        },
      })
    }
  }

  async getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<Result<GetCategoriesResponse>> {
    this.logger.info('getCategories', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    try {
      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      const categories = await this.advertCategoryModel.findAndCountAll({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
        include: AdvertMainCategoryDTO,
      })

      const mapped = categories.rows.map((item) => advertCategoryMigrate(item))

      return Promise.resolve({
        ok: true,
        value: {
          categories: mapped,
          paging: generatePaging(mapped, page, pageSize, categories.count),
        },
      })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getCategories',
        method: 'getCategories',
        info: {
          params,
        },
      })
    }
  }

  async getAdvert(id: string): Promise<Result<GetAdvertResponse>> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })
    try {
      if (!id) {
        this.logger.error('No id present in getAdvert')
        return Promise.resolve({
          ok: false,
          error: {
            code: 400,
            message: 'Bad request',
            category: LOGGING_CATEGORY,
          },
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
      if (advert) {
        const ad = advertMigrate(advert)
        return Promise.resolve({
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
        })
      } else {
        this.logger.warn(`Advert not found in getAdvert<${id}>`)
        return Promise.resolve({
          ok: false,
          error: { code: 404, message: `Could not find advert<${id}>` },
        })
      }
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getAdvert',
        method: 'getAdvert',
        info: {
          id,
        },
      })
    }
  }

  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<Result<GetAdvertsResponse>> {
    this.logger.info('getAdverts', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })

    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
    const searchCondition = params?.search ? `%${params.search}%` : undefined
    try {
      const adverts = await this.advertModel.findAndCountAll({
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

      return Promise.resolve({ ok: true, value: result })
    } catch (e) {
      return handleException({
        category: LOGGING_CATEGORY,
        error: e,
        message: 'Error in getAdverts',
        method: 'getAdverts',
        info: {
          params,
        },
      })
    }
  }
}
