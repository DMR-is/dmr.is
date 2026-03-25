import { GetPublicationsQueryDto } from './dto/publication.dto'
import { AdvertPublicationController } from './publication.controller'
import type { IPublicationService as IPublicationServiceContract } from './publication.service.interface'
import { PublicationSearchTrackingService } from './publication-search-tracking.service'

const buildPublicationsResponse = ({
  page = 1,
  pageSize = 20,
  totalItems = 1,
  publications = [{ id: 'publication-1' }],
}: {
  page?: number
  pageSize?: number
  totalItems?: number
  publications?: Array<{ id: string }>
}) => ({
  publications,
  paging: {
    page,
    totalPages: totalItems === 0 ? 0 : 1,
    totalItems,
    nextPage: null,
    previousPage: null,
    pageSize,
    hasNextPage: false,
    hasPreviousPage: false,
  },
})

const buildQuery = (
  overrides: Partial<GetPublicationsQueryDto> = {},
): GetPublicationsQueryDto =>
  Object.assign(new GetPublicationsQueryDto(), {
    page: 1,
    pageSize: 20,
    ...overrides,
  })

describe('AdvertPublicationController behavior', () => {
  let controller: AdvertPublicationController
  const publicationServiceMock = {
    createPublication: jest.fn(),
    updatePublication: jest.fn(),
    deletePublication: jest.fn(),
    getPublicationById: jest.fn(),
    getPublicationByNumberAndVersion: jest.fn(),
    getPublications: jest.fn(),
    getPublicationsCombinedHTML: jest.fn(),
    getPublishedPublicationsByAdvertId: jest.fn(),
    getRelatedPublications: jest.fn(),
  } satisfies IPublicationServiceContract
  const trackMock = jest.fn<
    ReturnType<PublicationSearchTrackingService['track']>,
    Parameters<PublicationSearchTrackingService['track']>
  >()
  const publicationSearchTrackingServiceMock = {
    track: trackMock,
  } as unknown as PublicationSearchTrackingService

  beforeAll(() => {
    controller = new AdvertPublicationController(
      publicationServiceMock,
      publicationSearchTrackingServiceMock,
    )
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks a normal publication search', async () => {
    publicationServiceMock.getPublications.mockResolvedValue(
      buildPublicationsResponse({
        publications: [{ id: 'publication-1' }, { id: 'publication-2' }],
        totalItems: 2,
      }),
    )

    const response = await controller.getPublishedPublications(
      buildQuery({
        search: 'notice',
      }),
    )

    expect(response.publications).toHaveLength(2)
    expect(trackMock).toHaveBeenCalledWith(
      buildQuery({
        search: 'notice',
      }),
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        pageResultCount: 2,
        totalResultCount: 2,
        durationMs: expect.any(Number),
      }),
    )
  })

  it('tracks zero-result publication searches', async () => {
    publicationServiceMock.getPublications.mockResolvedValue(
      buildPublicationsResponse({
        page: 2,
        pageSize: 50,
        publications: [],
        totalItems: 0,
      }),
    )

    const response = await controller.getPublishedPublications(
      buildQuery({
        search: 'missing',
        page: 2,
        pageSize: 50,
      }),
    )

    expect(response.publications).toHaveLength(0)
    expect(trackMock).toHaveBeenCalledWith(
      buildQuery({
        search: 'missing',
        page: 2,
        pageSize: 50,
      }),
      expect.objectContaining({
        page: 2,
        pageSize: 50,
        pageResultCount: 0,
        totalResultCount: 0,
        durationMs: expect.any(Number),
      }),
    )
  })

  it('returns results without waiting for tracking to finish', async () => {
    publicationServiceMock.getPublications.mockResolvedValue(
      buildPublicationsResponse({
        publications: [{ id: 'publication-1' }],
        totalItems: 1,
      }),
    )
    trackMock.mockReturnValue(new Promise(() => undefined))

    await expect(
      controller.getPublishedPublications(buildQuery({ search: 'fast' })),
    ).resolves.toEqual(
      buildPublicationsResponse({
        publications: [{ id: 'publication-1' }],
        totalItems: 1,
      }),
    )
  })
})
