import { generate } from 'rxjs'
import { where } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ADVERT_B_866_2006,
  ADVERT_B_1278_2023,
  ALL_MOCK_JOURNAL_CATEGORIES,
  ALL_MOCK_JOURNAL_DEPARTMENTS,
  ALL_MOCK_JOURNAL_INVOLVED_PARTIES,
  ALL_MOCK_JOURNAL_MAIN_CATEGORIES,
  ALL_MOCK_JOURNAL_TYPES,
  ALL_MOCK_SIGNATURES,
  MOCK_PAGING_SINGLE_PAGE,
} from '@dmr.is/mocks'
import {
  Advert,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
} from '@dmr.is/shared/dto'
import { generatePaging, slicePagedData } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import {
  AdvertCategoriesDTO,
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertMainCategoryDTO,
  AdvertStatusDTO,
  AdvertStatusHistoryDTO,
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

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'JournalService'
@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(AdvertDepartmentDTO)
    private advertDepartmentModel: typeof AdvertDepartmentDTO,

    @InjectModel(AdvertTypeDTO)
    private advertTypeModel: typeof AdvertTypeDTO,

    @InjectModel(AdvertDTO)
    private advertModel: typeof AdvertDTO,

    @InjectModel(AdvertCategoryDTO)
    private advertCategoryModel: typeof AdvertCategoryDTO,

    @InjectModel(AdvertInvolvedPartyDTO)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyDTO,

    @InjectModel(AdvertStatusDTO)
    private advertStatusModel: typeof AdvertStatusDTO,

    @InjectModel(AdvertStatusHistoryDTO)
    private advertStatusHistoryModel: typeof AdvertStatusHistoryDTO,

    @Inject(AdvertMainCategoryDTO)
    private advertMainCategoryModel: typeof AdvertMainCategoryDTO,

    private PAGING_DEFAULT_PAGE_SIZE = 10,
  ) {
    this.logger.log({ level: 'info', message: 'JournalService' })
  }

  async getAdvert(id: string): Promise<Advert | null> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })

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
      return Promise.resolve(null)
    }
  }

  async getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    this.logger.info('getAdverts', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })

    const adverts = await this.advertModel.findAll()
    //TODO FILTERING
    /* const filteredMockAdverts = (allMockAdverts as Advert[]).filter(
      (advert) => {
        if (!params?.search) {
          return true
        }

        return advert.title.includes(params.search)
      },
    )
*/
    const result: GetAdvertsResponse = {
      adverts: adverts.map((item) => advertMigrate(item)),
      paging: {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: 0,
        nextPage: 0,
        previousPage: null,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }

    return Promise.resolve(result)
  }

  async getDepartment(id: string): Promise<GetDepartmentResponse> {
    const department = await this.advertDepartmentModel.findOne({
      where: { id },
    })

    return Promise.resolve({
      department: department ? advertDepartmentMigrate(department) : null,
    })
  }

  async getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    const departments = await this.advertDepartmentModel.findAll()
    //TODO filtering and fix paging
    return Promise.resolve({
      departments: departments.map((item) => advertDepartmentMigrate(item)),
      paging: MOCK_PAGING_SINGLE_PAGE,
    })
  }

  async getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    const types = await this.advertTypeModel.findAll()

    return Promise.resolve({
      types: types.map((item) => advertTypesMigrate(item)),
      paging: generatePaging(types, 1),
    })
    /* const mockTypes = ALL_MOCK_JOURNAL_TYPES

    const filtered = mockTypes.filter((type) => {
      if (params?.department && params.department !== type.department.id) {
        return false
      }

      if (
        params?.search &&
        !type.id.toLocaleLowerCase().includes(params.search.toLocaleLowerCase())
      ) {
        return false
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)

    return Promise.resolve({
      types: paged,
      paging: generatePaging(filtered, page),
    })
    */
  }

  async getMainCategories(
    params?: GetMainCategoriesQueryParams | undefined,
  ): Promise<GetMainCategoriesResponse> {
    const mainCategories = await this.advertMainCategoryModel.findAll()
    return Promise.resolve({
      mainCategories: mainCategories.map((item) =>
        advertMainCategoryMigrate(item),
      ),
      paging: generatePaging(mainCategories, 1),
    })

    /* const mockCategories = ALL_MOCK_JOURNAL_MAIN_CATEGORIES
    const filtered = mockCategories.filter((category) => {
      if (params?.search && category.id !== params.search) {
        return false
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)
    const data: GetMainCategoriesResponse = {
      mainCategories: paged,
      paging: generatePaging(filtered, page),
    }

    return Promise.resolve(data)*/
  }

  async getCategories(
    params?: GetCategoriesQueryParams | undefined,
  ): Promise<GetCategoriesResponse> {
    const categories = await this.advertCategoryModel.findAll()
    return Promise.resolve({
      categories: categories.map((item) => advertCategoryMigrate(item)),
      paging: generatePaging(categories, 1),
    })

    /* const mockCategories = ALL_MOCK_JOURNAL_CATEGORIES
    const filtered = mockCategories.filter((category) => {
      if (params?.search && category.id !== params.search) {
        return false
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)
    const data: GetCategoriesResponse = {
      categories: paged,
      paging: generatePaging(filtered, page),
    }

    return Promise.resolve(data)*/
  }

  async getInstitution(id: string): Promise<GetInstitutionResponse> {
    const party = await this.advertInvolvedPartyModel.findOne({ where: { id } })

    return Promise.resolve({
      institution: party ? advertInvolvedPartyMigrate(party) : null,
    })
    /*const mockCategories = ALL_MOCK_JOURNAL_INVOLVED_PARTIES

    const institution = mockCategories.find((category) => category.id === id)

    return Promise.resolve({
      institution: institution ?? null,
    })*/
  }

  async getInstitutions(
    params?: GetInstitutionsQueryParams | undefined,
  ): Promise<GetInstitutionsResponse> {
    const parties = await this.advertInvolvedPartyModel.findAll()
    return Promise.resolve({
      institutions: parties.map((item) => advertInvolvedPartyMigrate(item)),
      paging: generatePaging(parties, 1),
    })
    /* const mockCategories = ALL_MOCK_JOURNAL_INVOLVED_PARTIES
    const filtered = mockCategories.filter((category) => {
      if (params?.search && category.id !== params.search) {
        return false
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)
    const data: GetInstitutionsResponse = {
      institutions: paged,
      paging: generatePaging(filtered, page),
    }

    return Promise.resolve(data)*/
  }

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    const filtered = ALL_MOCK_SIGNATURES.filter((signature) => {
      if (params?.id && params.id !== signature.id) {
        return false
      }

      if (params?.type && params.type !== signature.type) {
        return false
      }

      if (params?.search) {
        const search = params.search.toLocaleLowerCase()

        signature.data.forEach((signature) =>
          signature.members.forEach((m) => {
            if (!m.name.toLocaleLowerCase().includes(search)) {
              return false
            }
            return true
          }),
        )
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)

    return Promise.resolve({
      items: paged,
      paging: generatePaging(filtered, page),
    })
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
