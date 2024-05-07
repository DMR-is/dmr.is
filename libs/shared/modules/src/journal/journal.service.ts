import { Op } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Advert,
  AdvertType,
  Category,
  Department,
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
  AdvertAttachmentsDTO,
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertMainCategoryDTO,
  AdvertStatusDTO,
  AdvertTypeDTO,
} from '../models'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertInvolvedPartyMigrate,
  advertMainCategoryMigrate,
  advertMigrate,
  advertTypesMigrate,
} from '../util'
import { IJournalService } from './journal.service.interface'

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
  async insertAdvert(model: Advert): Promise<Advert | null> {
    throw new Error('Method not implemented.')
  }
  async updateAdvert(model: Advert): Promise<Advert | null> {
    throw new Error('Method not implemented.')
  }
  async insertDepartment(
    model: Department,
  ): Promise<GetDepartmentResponse | null> {
    throw new Error('Method not implemented.')
  }
  async updateDepartment(
    model: Department,
  ): Promise<GetDepartmentResponse | null> {
    throw new Error('Method not implemented.')
  }
  async insertType(model: AdvertType): Promise<GetAdvertTypeResponse | null> {
    throw new Error('Method not implemented.')
  }
  async updateType(model: AdvertType): Promise<GetAdvertTypeResponse | null> {
    throw new Error('Method not implemented.')
  }
  async insertMainCategory(
    model: MainCategory,
  ): Promise<GetMainCategoryResponse | null> {
    if (!model) {
      this.logger.error('No model in insertMainCategory')
      return Promise.resolve(null)
    }
    try {
      const mainCategory = await this.advertMainCategoryModel.create({
        title: model.title,
        slug: model.slug,
        description: model.description,
      })
      return { mainCategory: advertMainCategoryMigrate(mainCategory) }
    } catch (e) {
      this.logger.error('Error in insertMainCategory', e as Error)
      return Promise.resolve(null)
    }
  }
  async updateMainCategory(
    model: MainCategory,
  ): Promise<GetMainCategoryResponse | null> {
    throw new Error('Method not implemented.')
  }
  async insertCategory(model: Category): Promise<GetCategoryResponse | null> {
    if (!model) {
      this.logger.error('No model in insertCategory')
      return Promise.resolve(null)
    }
    const category = await this.advertCategoryModel.create({
      title: model.title,
      slug: model.slug,
      mainCategoryID: model.mainCategory?.id,
    })
    return { category: advertCategoryMigrate(category) }
  }
  async updateCategory(model: Category): Promise<GetCategoryResponse | null> {
    if (!model || !model.id) {
      this.logger.error('No model or id in updateCategory')
      return Promise.resolve(null)
    }
    const category = await this.advertCategoryModel.update(
      {
        title: model.title,
        slug: model.slug,
        mainCategoryID: model.mainCategory?.id,
      },
      { where: { id: model.id }, returning: true },
    )
    return { category: advertCategoryMigrate(category[1][0]) }
  }
  insertInstitution(
    model: Institution,
  ): Promise<GetInstitutionResponse | null> {
    throw new Error('Method not implemented.')
  }
  updateInstitution(
    model: Institution,
  ): Promise<GetInstitutionResponse | null> {
    throw new Error('Method not implemented.')
  }

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    this.logger.info('getSignatures', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    throw new Error('Method not implemented.')
  }
  error(): void {
    throw new Error('Method not implemented.')
  }

  async getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse | null> {
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
        mainCategories: mainCategories.map((item) =>
          advertMainCategoryMigrate(item),
        ),
        paging: generatePaging(mainCategories, page),
      })
    } catch (e) {
      this.logger.error('Error in getMainCategories', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getDepartment(id: string): Promise<GetDepartmentResponse | null> {
    try {
      if (!id) {
        this.logger.error('No id present in getDepartment')
        return Promise.resolve(null)
      }
      const department = await this.advertDepartmentModel.findOne({
        where: { id },
      })

      return Promise.resolve({
        department: department ? advertDepartmentMigrate(department) : null,
      })
    } catch (e) {
      this.logger.error('Error in getDepartment', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse | null> {
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
        departments: departments.map((item) => advertDepartmentMigrate(item)),
        paging: generatePaging(departments, page),
      })
    } catch (e) {
      this.logger.error('Error in getDepartments', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getType(id: string): Promise<AdvertType | null> {
    try {
      const type = await this.advertTypeModel.findOne<AdvertTypeDTO>({
        include: AdvertDepartmentDTO,
        where: {
          id: { [Op.eq]: id },
        },
      })

      if (!type) {
        throw new NotFoundException(`Type not found with id: ${id}`)
      }

      return Promise.resolve(advertTypesMigrate(type))
    } catch (e) {
      this.logger.error('Error in getType', {
        category: LOGGING_CATEGORY,
        error: e as Error,
      })
      return Promise.resolve(null)
    }
  }

  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse | null> {
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
        types: mappedTypes,
        paging: generatePaging(types, page),
      })
    } catch (e) {
      this.logger.error('Error in getTypes', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getInstitution(id: string): Promise<GetInstitutionResponse | null> {
    try {
      if (!id) {
        this.logger.error('No id present in getInstitution')
        return Promise.resolve(null)
      }
      const party = await this.advertInvolvedPartyModel.findOne({
        where: { id },
      })

      return Promise.resolve({
        institution: party ? advertInvolvedPartyMigrate(party) : null,
      })
    } catch (e) {
      this.logger.error('Error in getInstitution', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse | null> {
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
        institutions: parties.map((item) => advertInvolvedPartyMigrate(item)),
        paging: generatePaging(parties, page),
      })
    } catch (e) {
      this.logger.error('Error in getInstitution', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    try {
      const category = await this.advertCategoryModel.findOne({
        where: { id },
        include: AdvertMainCategoryDTO,
      })

      return Promise.resolve(category ? advertCategoryMigrate(category) : null)
    } catch (e) {
      this.logger.error('Error in getCategory', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse | null> {
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
        categories: categories.map((item) => advertCategoryMigrate(item)),
        paging: generatePaging(categories, 1),
      })
    } catch (e) {
      this.logger.error('Error in getCategories', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getAdvert(id: string): Promise<Advert | null> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })
    try {
      if (!id) {
        this.logger.error('No id present in getAdvert')
        return Promise.resolve(null)
      }
      const advert = await this.advertModel.findOne({
        where: { id: parseInt(id, 10) },
      })
      if (advert) {
        const ad = advertMigrate(advert)
        return Promise.resolve({
          ...ad,
          document: {
            isLegacy: advert.isLegacy,
            html: advert.isLegacy
              ? dirtyClean(advert.documentHtml as HTMLText)
              : advert.documentHtml,
            pdfUrl: advert.documentPdfUrl,
          },
        })
      } else {
        this.logger.warn(`Article not found in getAdvert - ${id}`)
        return Promise.resolve(null)
      }
    } catch (e) {
      this.logger.error('Error in getAdvert', { error: e as Error })
      return Promise.resolve(null)
    }
  }

  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse | null> {
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

      return Promise.resolve(result)
    } catch (e) {
      this.logger.error('Error in getAdverts', { error: e as Error })
      return Promise.resolve(null)
    }
  }
}
