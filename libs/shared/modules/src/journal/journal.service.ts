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

import { Result } from '../types/result'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
  advertTypesMigrate,
} from '../util'
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
  async insertAdvert(model: Advert): Promise<Result<GetAdvertResponse>> {
    if (!model) {
      this.logger.error('No model in insertAdvert')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in insertAdvert', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async updateAdvert(model: Advert): Promise<Result<GetAdvertResponse>> {
    if (!model) {
      this.logger.error('No model in updateAdvert')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in updateAdvert', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async insertDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    if (!model) {
      this.logger.error('No model in insertDepartment')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
      })
    }

    try {
      const dep = await this.advertDepartmentModel.create({
        title: model.title,
        slug: model.slug,
      })
      return { ok: true, value: { department: dep } }
    } catch (e) {
      this.logger.error('Error in insertDepartment', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async updateDepartment(
    model: Department,
  ): Promise<Result<GetDepartmentResponse>> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateDepartment')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
      })
    }
    try {
      const dep = await this.advertDepartmentModel.update(
        { title: model.title, slug: model.slug },
        { where: { id: model.id }, returning: true },
      )
      if (!dep) {
        throw new NotFoundException()
      }
      return {
        ok: true,
        value: { department: advertDepartmentMigrate(dep[1][0]) },
      }
    } catch (e) {
      this.logger.error('Error in updateDepartment', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async insertInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    if (!model) {
      this.logger.error('No model in insertInstitution')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
      })
    }

    try {
      const inst = await this.advertInvolvedPartyModel.create({
        title: model.title,
        slug: model.slug,
      })

      return { ok: true, value: { institution: inst } }
    } catch (e) {
      this.logger.error('Error in insertInstitution', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async updateInstitution(
    model: Institution,
  ): Promise<Result<GetInstitutionResponse>> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateInstitution')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in updateInstitution', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
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
    if (!model) {
      this.logger.error('No model in insertType')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in insertType', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async updateType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateMainCategory')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in updateType', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
  async insertMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    if (!model) {
      this.logger.error('No model in insertMainCategory')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in insertMainCategory', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async updateMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateMainCategory')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in updateMainCategory', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async insertCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    if (!model) {
      this.logger.error('No model in insertCategory')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in insertCategory', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async updateCategory(model: Category): Promise<Result<GetCategoryResponse>> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateCategory')
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
      this.logger.error('Error in updateCategory', e as Error)
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<Result<GetMainCategoriesResponse>> {
    try {
      const page = params?.page ?? 1
      const mainCategories = await this.advertMainCategoryModel.findAll({
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
      })
      return Promise.resolve({
        ok: true,
        value: {
          mainCategories: mainCategories.map((item) =>
            advertMainCategoryMigrate(item),
          ),
          paging: generatePaging(mainCategories, page),
        },
      })
    } catch (e) {
      this.logger.error('Error in getMainCategories', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getDepartment(id: string): Promise<Result<GetDepartmentResponse>> {
    try {
      if (!id) {
        this.logger.error('No id present in getDepartment')
        return Promise.resolve({
          ok: false,
          error: { code: '400', message: 'Bad request' },
        })
      }
      const department = await this.advertDepartmentModel.findOne({
        where: { id },
      })

      return Promise.resolve({
        ok: true,
        value: {
          department: department ? advertDepartmentMigrate(department) : null,
        },
      })
    } catch (e) {
      this.logger.error('Error in getDepartment', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<Result<GetDepartmentsResponse>> {
    try {
      const page = params?.page ?? 1
      const departments = await this.advertDepartmentModel.findAll({
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
      })
      return Promise.resolve({
        ok: true,
        value: {
          departments: departments.map((item) => advertDepartmentMigrate(item)),
          paging: generatePaging(departments, page),
        },
      })
    } catch (e) {
      this.logger.error('Error in getDepartments', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getType(id: string): Promise<Result<GetAdvertTypeResponse>> {
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
          error: { code: '404', message: 'Not found' },
        })
      }

      return { ok: true, value: { type: type } }
    } catch (e) {
      this.logger.error('Error in getType', {
        category: LOGGING_CATEGORY,
        error: e as Error,
      })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<Result<GetAdvertTypesResponse>> {
    try {
      const page = params?.page ?? 1

      const types = await this.advertTypeModel.findAll<AdvertTypeDTO>({
        include: AdvertDepartmentDTO,
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              id: { [Op.eq]: params.search },
            }
          : undefined,
      })

      const mappedTypes = types.map((item) => advertTypesMigrate(item))

      return Promise.resolve({
        ok: true,
        value: {
          types: mappedTypes,
          paging: generatePaging(types, page),
        },
      })
    } catch (e) {
      this.logger.error('Error in getTypes', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getInstitution(id: string): Promise<Result<GetInstitutionResponse>> {
    try {
      if (!id) {
        this.logger.error('No id present in getInstitution')
        return Promise.resolve({
          ok: false,
          error: { code: '400', message: 'Bad request' },
        })
      }
      const party = await this.advertInvolvedPartyModel.findOne({
        where: { id },
      })
      if (!party) {
        return Promise.resolve({
          ok: false,
          error: { code: '404', message: 'Not found' },
        })
      }

      return Promise.resolve({
        ok: true,
        value: {
          institution: advertInvolvedPartyMigrate(party),
        },
      })
    } catch (e) {
      this.logger.error('Error in getInstitution', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<Result<GetInstitutionsResponse>> {
    try {
      const page = params?.page ?? 1
      const parties = await this.advertInvolvedPartyModel.findAll({
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
      })

      return Promise.resolve({
        ok: true,
        value: {
          institutions: parties.map((item) => advertInvolvedPartyMigrate(item)),
          paging: generatePaging(parties, page),
        },
      })
    } catch (e) {
      this.logger.error('Error in getInstitution', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getCategory(id: string): Promise<Result<GetCategoryResponse>> {
    if (!id) {
      return Promise.resolve({
        ok: false,
        error: { code: '400', message: 'Bad request' },
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
          error: { code: '404', message: 'Not found' },
        })
      }

      return Promise.resolve({
        ok: true,
        value: { category: advertCategoryMigrate(category) },
      })
    } catch (e) {
      this.logger.error('Error in getCategory', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }

  async getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<Result<GetCategoriesResponse>> {
    try {
      const page = params?.page ?? 1
      const categories = await this.advertCategoryModel.findAll({
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
        include: AdvertMainCategoryDTO,
      })
      return Promise.resolve({
        ok: true,
        value: {
          categories: categories.map((item) => advertCategoryMigrate(item)),
          paging: generatePaging(categories, 1),
        },
      })
    } catch (e) {
      this.logger.error('Error in getCategories', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
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
          error: { code: '400', message: 'Bad request' },
        })
      }
      const advert = await this.advertModel.findOne({
        where: { id: parseInt(id, 10) },
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
        this.logger.warn(`Article not found in getAdvert - ${id}`)
        return Promise.resolve({
          ok: false,
          error: { code: '404', message: 'Not found' },
        })
      }
    } catch (e) {
      this.logger.error('Error in getAdvert', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
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
    try {
      const page = params?.page ?? 1
      const adverts = await this.advertModel.findAll({
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
        where: params?.search
          ? {
              title: { [Op.iLike]: `%${params?.search}%` },
            }
          : undefined,
        include: [
          AdvertTypeDTO,
          AdvertDepartmentDTO,
          AdvertStatusDTO,
          AdvertInvolvedPartyDTO,
          AdvertAttachmentsDTO,
          AdvertCategoryDTO,
        ],
      })
      const result: GetAdvertsResponse = {
        adverts: adverts.map((item) => advertMigrate(item)),
        paging: generatePaging(adverts, page),
      }

      return Promise.resolve({ ok: true, value: result })
    } catch (e) {
      this.logger.error('Error in getAdverts', { error: e as Error })
      return Promise.resolve({
        ok: false,
        error: { code: '500', message: 'Error' },
      })
    }
  }
}
