import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
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

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { IJournalService } from './journal.service.interface'

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'MockJournalService'
@Injectable()
export class MockJournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using MockJournalService')
  }
  getInstitution(id: string): Promise<GetInstitutionResponse> {
    throw new Error('Method not implemented.')
  }

  getDepartment(id: string): Promise<GetDepartmentResponse> {
    throw new Error('Method not implemented.')
  }

  async getAdvert(id: string): Promise<Advert | null> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })

    const advert = (allMockAdverts as Advert[]).find(
      (advert) => advert.id === id,
    )

    if (advert) {
      return Promise.resolve({
        ...advert,
        document: {
          isLegacy: advert.document.isLegacy,
          html: advert.document.isLegacy
            ? dirtyClean(advert.document.html as HTMLText)
            : advert.document.html,
          pdfUrl: advert.document.pdfUrl,
        },
      })
    } else {
      return Promise.resolve(null)
    }
  }

  getAdverts(params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse> {
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

    return Promise.resolve(result)
  }

  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    const mockDepartments = ALL_MOCK_JOURNAL_DEPARTMENTS

    const filtered = mockDepartments.filter((department) => {
      if (params?.search && department.id !== params.search) {
        return false
      }

      return true
    })

    return Promise.resolve({
      departments: filtered,
      paging: MOCK_PAGING_SINGLE_PAGE,
    })
  }

  getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    const mockTypes = ALL_MOCK_JOURNAL_TYPES

    const filtered = mockTypes.filter((type) => {
      if (params?.department && params.department !== type.department?.id) {
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
  }

  getMainCategories(
    params?: GetMainCategoriesQueryParams | undefined,
  ): Promise<GetMainCategoriesResponse> {
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

    return Promise.resolve(data)
  }

  getCategories(
    params?: GetCategoriesQueryParams | undefined,
  ): Promise<GetCategoriesResponse> {
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

    return Promise.resolve(data)
  }

  getInstitutions(
    params?: GetInstitutionsQueryParams | undefined,
  ): Promise<GetInstitutionsResponse> {
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

    return Promise.resolve(data)
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
