import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertSearchEventModel } from './models/advert-search-event.model'
import { LeanSearchQueryKind } from './lean-search-tracking.dto'
import { LeanSearchTrackingService } from './lean-search-tracking.service'

describe('LeanSearchTrackingService', () => {
  let service: LeanSearchTrackingService
  const advertSearchEventModelMock = {
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
        LeanSearchTrackingService,
        {
          provide: getModelToken(AdvertSearchEventModel),
          useValue: advertSearchEventModelMock,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: loggerMock,
        },
      ],
    }).compile()

    service = module.get<LeanSearchTrackingService>(LeanSearchTrackingService)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs and persists a tracking payload', async () => {
    advertSearchEventModelMock.create.mockResolvedValue({})

    await service.track(
      { search: 'Search', department: 'beta,alpha' },
      {
        page: 1,
        pageSize: 20,
        pageResultCount: 2,
        totalResultCount: 5,
        durationMs: 12,
      },
    )

    expect(loggerMock.info).toHaveBeenCalledWith(
      'lean_search_tracking',
      expect.objectContaining({
        context: 'LeanSearchTrackingService',
        route: '/api/v1/adverts-lean',
        backend: 'opensearch',
        normalizedQuery: 'search',
        queryKind: LeanSearchQueryKind.FreeText,
        filters: {
          department: ['alpha', 'beta'],
        },
      }),
    )
    expect(advertSearchEventModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        route: '/api/v1/adverts-lean',
        backend: 'opensearch',
        normalizedQuery: 'search',
        queryKind: LeanSearchQueryKind.FreeText,
        filters: {
          department: ['alpha', 'beta'],
        },
      }),
    )
  })

  it('warns and resolves when persistence fails', async () => {
    advertSearchEventModelMock.create.mockRejectedValue(new Error('db failed'))

    await expect(
      service.track(
        { search: 'failure' },
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
      'Failed to persist lean search tracking event',
      expect.objectContaining({
        context: 'LeanSearchTrackingService',
        route: '/api/v1/adverts-lean',
        queryKind: LeanSearchQueryKind.FreeText,
        error: expect.any(Error),
      }),
    )
  })
})
