import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { PublicationSearchEventModel } from '../../../models/publication-search-event.model'
import { GetPublicationsQueryDto } from './dto/publication.dto'
import { PublicationSearchQueryKind } from './dto/publication-search-tracking.dto'
import { PublicationSearchTrackingService } from './publication-search-tracking.service'

const buildQuery = (
  overrides: Partial<GetPublicationsQueryDto> = {},
): GetPublicationsQueryDto =>
  Object.assign(new GetPublicationsQueryDto(), {
    page: 1,
    pageSize: 20,
    ...overrides,
  })

describe('PublicationSearchTrackingService', () => {
  let service: PublicationSearchTrackingService
  const publicationSearchEventModelMock = {
    create: jest.fn(),
  }
  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationSearchTrackingService,
        {
          provide: getModelToken(PublicationSearchEventModel),
          useValue: publicationSearchEventModelMock,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: loggerMock,
        },
      ],
    }).compile()

    service = module.get<PublicationSearchTrackingService>(
      PublicationSearchTrackingService,
    )
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs and persists a tracking payload', async () => {
    publicationSearchEventModelMock.create.mockResolvedValue({})

    await service.track(
      buildQuery({
        search: 'Search',
        categoryId: [
          '44444444-4444-4444-8444-444444444444',
          '33333333-3333-4333-8333-333333333333',
        ],
      }),
      {
        page: 1,
        pageSize: 20,
        pageResultCount: 2,
        totalResultCount: 5,
        durationMs: 12,
      },
    )

    expect(loggerMock.info).toHaveBeenCalledWith(
      'publication_search_tracking',
      expect.objectContaining({
        context: 'PublicationSearchTrackingService',
        route: '/api/v1/publications',
        backend: 'postgres',
        normalizedQuery: 'search',
        queryKind: PublicationSearchQueryKind.FreeText,
        filters: {
          categoryId: [
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
          ],
        },
      }),
    )
    expect(publicationSearchEventModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        route: '/api/v1/publications',
        backend: 'postgres',
        normalizedQuery: 'search',
        queryKind: PublicationSearchQueryKind.FreeText,
        filters: {
          categoryId: [
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
          ],
        },
      }),
    )
  })

  it('warns and resolves when persistence fails', async () => {
    publicationSearchEventModelMock.create.mockRejectedValue(
      new Error('db failed'),
    )

    await expect(
      service.track(
        buildQuery({ search: 'failure' }),
        {
          page: 1,
          pageSize: 20,
          pageResultCount: 0,
          totalResultCount: 0,
          durationMs: 8,
        },
      ),
    ).resolves.toBeUndefined()

    expect(loggerMock.warn).toHaveBeenCalledWith(
      'Failed to persist publication search tracking event',
      expect.objectContaining({
        context: 'PublicationSearchTrackingService',
        route: '/api/v1/publications',
        queryKind: PublicationSearchQueryKind.FreeText,
        error: expect.any(Error),
      }),
    )
  })
})
