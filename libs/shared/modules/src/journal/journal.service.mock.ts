/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ADVERT_B_866_2006,
  ADVERT_B_1278_2023,
  ALL_MOCK_JOURNAL_CATEGORIES,
  ALL_MOCK_JOURNAL_DEPARTMENTS,
  ALL_MOCK_JOURNAL_INVOLVED_PARTIES,
  ALL_MOCK_JOURNAL_MAIN_CATEGORIES,
  ALL_MOCK_SIGNATURES,
  MOCK_PAGING_SINGLE_PAGE,
} from '@dmr.is/mocks'
import {
  Advert,
  Category,
  CreateAdvert,
  CreateMainCategory,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
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
  GetSimilarAdvertsResponse,
  Institution,
  UpdateAdvertBody,
  UpdateMainCategory,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, slicePagedData } from '@dmr.is/utils'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { IJournalService } from './journal.service.interface'

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'MockJournalService'
@Injectable()
export class MockJournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using MockJournalService')
  }
  deleteCategory(id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  insertMainCategoryCategories(
    mainCategoryId: string,
    categoryIds: string[],
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  deleteMainCategoryCategory(
    mainCategoryId: string,
    categoryId: string,
  ): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  deleteMainCategory(id: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  create(model: CreateAdvert): Promise<ResultWrapper<GetAdvertResponse>> {
    throw new Error('Method not implemented.')
  }
  updateAdvert(
    id: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>> {
    throw new Error('Method not implemented.')
  }
  getDepartment(id: string): Promise<ResultWrapper<GetDepartmentResponse>> {
    throw new Error('Method not implemented.')
  }
  insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    throw new Error('Method not implemented.')
  }
  updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>> {
    throw new Error('Method not implemented.')
  }
  insertMainCategory(
    model: CreateMainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    throw new Error('Method not implemented.')
  }
  updateMainCategory(
    id: string,
    body: UpdateMainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    throw new Error('Method not implemented.')
  }
  getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>> {
    throw new Error('Method not implemented.')
  }
  insertCategory(title: string): Promise<ResultWrapper<GetCategoryResponse>> {
    throw new Error('Method not implemented.')
  }
  updateCategory(
    id: string,
    model: Category,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    throw new Error('Method not implemented.')
  }
  mergeCategories(from: string, to: string): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>> {
    throw new Error('Method not implemented.')
  }
  insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    throw new Error('Method not implemented.')
  }
  updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>> {
    throw new Error('Method not implemented.')
  }
  getSimilarAdverts(
    advertId: string,
    limit = 10,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>> {
    throw new Error('Method not implemented.')
  }

  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })

    const advert = (allMockAdverts as Advert[]).find(
      (advert) => advert.id === id,
    )

    if (!advert) {
      throw new NotFoundException()
    }

    return Promise.resolve(ResultWrapper.ok({ advert }))
  }

  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>> {
    this.logger.info('getAdverts', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    const filteredMockAdverts = (allMockAdverts as Advert[]).filter(
      (advert) => {
        if (!params?.search) {
          return true
        }

        return advert.title.includes(params.search)
      },
    )

    const result: GetAdvertsResponse = {
      adverts: filteredMockAdverts,
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

    return Promise.resolve(ResultWrapper.ok(result))
  }

  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>> {
    const mockDepartments = ALL_MOCK_JOURNAL_DEPARTMENTS

    const filtered = mockDepartments.filter((department) => {
      if (params?.search && department.id !== params.search) {
        return false
      }

      return true
    })

    return Promise.resolve(
      ResultWrapper.ok({
        departments: filtered,
        paging: MOCK_PAGING_SINGLE_PAGE,
      }),
    )
  }

  getMainCategories(
    params?: GetMainCategoriesQueryParams | undefined,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>> {
    const mockCategories = ALL_MOCK_JOURNAL_MAIN_CATEGORIES
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

    return Promise.resolve(ResultWrapper.ok(data))
  }

  getCategories(
    params?: GetCategoriesQueryParams | undefined,
  ): Promise<ResultWrapper<GetCategoriesResponse>> {
    const mockCategories = ALL_MOCK_JOURNAL_CATEGORIES
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

    return Promise.resolve(ResultWrapper.ok(data))
  }

  getInstitutions(
    params?: GetInstitutionsQueryParams | undefined,
  ): Promise<ResultWrapper<GetInstitutionsResponse>> {
    const mockCategories = ALL_MOCK_JOURNAL_INVOLVED_PARTIES
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

    return Promise.resolve(ResultWrapper.ok(data))
  }

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>> {
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

    return Promise.resolve(
      ResultWrapper.ok({
        items: paged,
        paging: generatePaging(filtered, page),
      }),
    )
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
