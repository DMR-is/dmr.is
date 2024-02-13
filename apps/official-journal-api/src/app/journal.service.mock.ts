import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
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
import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPaging } from '../dto/journal-paging.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'
import { v4 as uuid } from 'uuid'
import { JournalAdvertStatus } from '../dto/journal-constants.dto'
import { JournalAdvertPublicationNumber } from '../dto/adverts/journal-advert-publication-number.dto'
import { JournalDocument } from '../dto/journal-document'

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
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using MockJournalService')
  }

  getAdvert(id: string): Promise<JournalAdvert | null> {
    this.logger.info('getAdvert', {
      category: LOGGING_CATEGORY,
      metadata: { id },
    })
    const advert = allMockAdverts.find((advert) => advert.id === id)

    return Promise.resolve(advert ?? null)
  }

  getAdverts(
    params?: JournalGetAdvertsQueryParams,
  ): Promise<JournalAdvertsResponse> {
    this.logger.info('getAdverts', {
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
    params?: JournalGetTypesQueryParams,
  ): Promise<JournalAdvertTypesResponse> {
    const mockTypes = ALL_MOCK_JOURNAL_TYPES

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
  }

  getCategories(
    params?: JournalGetCategoriesQueryParams | undefined,
  ): Promise<JournalAdvertCategoriesResponse> {
    const mockCategories = ALL_MOCK_JOURNAL_CATEGORIES
    const filtered = mockCategories.filter((category) => {
      if (params?.search && category.id !== params.search) {
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

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse> {
    const department = ALL_MOCK_JOURNAL_DEPARTMENTS.find(
      (d) => d.id === body.department,
    )

    if (!department) {
      throw new BadRequestException('Department not found') // We need to return the field and reason
    }

    const categories = ALL_MOCK_JOURNAL_CATEGORIES.filter((c) =>
      body.categories.includes(c.id),
    )

    if (!categories.length) {
      throw new BadRequestException('Invalid category') // We need to return the field and reason
    }

    const type = ALL_MOCK_JOURNAL_TYPES.find((t) => t.id === body.type)

    if (!type) {
      throw new BadRequestException('Type not found') // We need to return the field and reason
    }

    this.logger.info('submitApplication', {
      category: LOGGING_CATEGORY,
      metadata: { body },
    })

    const advertTitle = `${type.title} ${body.subject}` // this results in AUGLÝSING AUGLÝSING um hundahald í ..., because the user needs to type in subject himself with the type included ()

    const advertDocument: JournalDocument = {
      isLegacy: false, // always false since it's coming from the application system
      html: body.document, // validate?
      pdfUrl: null, // generate this earlier in the process? (preview step)
    }

    // needs to be created at same time as the advert
    const year = new Date().getFullYear()
    const publicationNumber = 1 // leaving this as 1 for now until we get the real number
    const advertPublicationNumber: JournalAdvertPublicationNumber = {
      number: publicationNumber,
      year: year,
      full: `${publicationNumber}/${year}`,
    }

    const advert: JournalAdvert = {
      id: uuid(),
      title: advertTitle,
      department: department,
      type: type,
      categories: categories,
      subject: body.subject,
      signatureDate: null, // this will be located with the signature object when that has been implemented
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      publicationDate: null, // always null when coming from the application system
      publicationNumber: advertPublicationNumber,
      document: advertDocument,
      involvedParty: null, // not implemented
      status: JournalAdvertStatus.Submitted, // always submitted when coming from the application system
    }

    return Promise.resolve({ advert })
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
