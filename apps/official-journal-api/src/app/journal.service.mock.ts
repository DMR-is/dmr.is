import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import {
  ADVERT_B_1278_2023,
  ADVERT_B_866_2006,
  ALL_MOCK_JOURNAL_CATEGORIES,
  ALL_MOCK_JOURNAL_DEPARTMENTS,
  ALL_MOCK_JOURNAL_TYPES,
  MOCK_PAGING_SINGLE_PAGE,
} from '../mock/journal.mock'
import { IJournalService } from './journal.service.interface'
import { JournalResponseStatus } from '../dto/journal-constants.dto'
import { JournalValidationResponse } from '../lib/types'
import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-category-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-category-responses.dto'
import { JournalPaging } from '../dto/journal-paging.dto'

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'MockJournalService'

const DEFAULT_PAGE_SIZE = 2

function slicePagedData<T>(
  data: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): T[] {
  return data.slice((page - 1) * pageSize, page * pageSize)
}

function generatePaging(
  data: unknown[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): JournalPaging {
  const totalPages = Math.ceil(data.length / pageSize)
  const totalItems = data.length
  const nextPage = page + 1
  const previousPage = page - 1

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    nextPage: nextPage <= totalPages ? nextPage : null,
    previousPage: previousPage > 0 ? previousPage : null,
    hasNextPage: nextPage <= totalPages,
    hasPreviousPage: previousPage > 0,
  }
}

@Injectable()
export class MockJournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: LoggerService) {
    this.logger.log('Using MockJournalService')
  }

  getAdvert(id: string): Promise<JournalAdvert | null> {
    this.logger.log('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })
    const advert = allMockAdverts.find((advert) => advert.id === id)

    return Promise.resolve(advert ?? null)
  }

  getAdverts(
    params?: JournalGetAdvertsQueryParams,
  ): Promise<JournalAdvertsResponse> {
    this.logger.log('getAdverts', {
      category: LOGGING_CATEGORY,
      metadata: { params },
    })
    const filteredMockAdverts = allMockAdverts.filter((advert) => {
      if (!params?.search) {
        return true
      }

      return advert.title.includes(params.search)
    })

    const result: JournalAdvertsResponse = {
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
    params?: JournalGetDepartmentsQueryParams,
  ): Promise<JournalAdvertDepartmentsResponse> {
    const mockDepartments = ALL_MOCK_JOURNAL_DEPARTMENTS

    const filtered = mockDepartments.filter((department) => {
      if (!params?.search) {
        return true
      }

      return department.title
        .toLocaleLowerCase()
        .includes(params.search.toLocaleLowerCase())
    })

    return Promise.resolve({
      departments: filtered,
      paging: MOCK_PAGING_SINGLE_PAGE,
    })
  }

  getTypes(
    params?: JournalGetTypesQueryParams,
  ): Promise<JournalAdvertTypesResponse> {
    const mockTypes = ALL_MOCK_JOURNAL_TYPES
    const filtered = mockTypes.filter((type) => {
      if (params?.department && params.department !== type.department.slug) {
        return false
      }

      if (
        params?.search &&
        !type.title
          .toLocaleLowerCase()
          .includes(params.search.toLocaleLowerCase())
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

  getCategories(
    params?: JournalGetCategoriesQueryParams | undefined,
  ): Promise<JournalAdvertCategoriesResponse> {
    const mockCategories = ALL_MOCK_JOURNAL_CATEGORIES
    const filtered = mockCategories.filter((category) => {
      if (
        params?.search &&
        !category.title
          .toLocaleLowerCase()
          .includes(params.search.toLocaleLowerCase())
      ) {
        return false
      }

      return true
    })

    const page = params?.page ?? 1
    const paged = slicePagedData(filtered, page)
    const data: JournalAdvertCategoriesResponse = {
      categories: paged,
      paging: generatePaging(filtered, page),
    }

    return Promise.resolve(data)
  }

  validateAdvert(advert: JournalAdvert): Promise<JournalValidationResponse> {
    this.logger.log('validateAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { advert },
    })

    return Promise.resolve({
      status: JournalResponseStatus.Error,
      errors: [
        {
          path: 'document.title',
          message: 'Title must be atleast 10 characters long',
        },
      ],
    })
  }

  submitAdvert(advert: JournalAdvert): Promise<JournalValidationResponse> {
    this.logger.log('submitAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { advert },
    })

    return Promise.resolve({
      status: JournalResponseStatus.Success,
    })
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
