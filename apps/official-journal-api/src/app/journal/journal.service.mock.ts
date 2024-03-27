import { v4 as uuid } from 'uuid'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { IJournalService } from './journal.service.interface'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import {
  ADVERT_B_1278_2023,
  ADVERT_B_866_2006,
  ALL_MOCK_JOURNAL_DEPARTMENTS,
  MOCK_PAGING_SINGLE_PAGE,
  ALL_MOCK_JOURNAL_TYPES,
  ALL_MOCK_JOURNAL_MAIN_CATEGORIES,
  ALL_MOCK_JOURNAL_CATEGORIES,
  ALL_MOCK_JOURNAL_INVOLVED_PARTIES,
  ALL_MOCK_SIGNATURES,
} from '@dmr.is/mocks'
import {
  Advert,
  AdvertDocument,
  AdvertPublicationNumber,
  AdvertStatus,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  PostApplicationBody,
  PostApplicationResponse,
  AdvertSignature,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'
import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

const allMockAdverts = [ADVERT_B_1278_2023, ADVERT_B_866_2006]

const LOGGING_CATEGORY = 'MockJournalService'

function slicePagedData<T>(
  data: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): T[] {
  return data.slice((page - 1) * pageSize, page * pageSize)
}

@Injectable()
export class MockJournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using MockJournalService')
  }

  getAdvert(id: string): Promise<Advert | null> {
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

  submitApplication(
    body: PostApplicationBody,
  ): Promise<PostApplicationResponse> {
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

    const advertDocument: AdvertDocument = {
      isLegacy: false, // always false since it's coming from the application system
      html: body.document, // validate?
      pdfUrl: null, // generate this earlier in the process? (preview step)
    }

    // needs to be created at same time as the advert
    const year = new Date().getFullYear()
    const publicationNumber = 1 // leaving this as 1 for now until we get the real number
    const advertPublicationNumber: AdvertPublicationNumber = {
      number: publicationNumber,
      year: year,
      full: `${publicationNumber}/${year}`,
    }

    const advertId = uuid()

    const signature: AdvertSignature = {
      id: uuid(),
      advertId: advertId,
      additional: body.signature.additional,
      type: body.signature.type,
      data: body.signature.data,
    }

    const advert: Advert = {
      id: advertId,
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
      status: AdvertStatus.Submitted, // always submitted when coming from the application system
      signature: signature,
    }

    return Promise.resolve({ advert })
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
