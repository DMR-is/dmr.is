import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { ApplicationModel } from '../../../models/application.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { RecallApplicationService } from './recall-application.service'

describe('RecallApplicationService', () => {
  let service: RecallApplicationService
  let advertModel: typeof AdvertModel

  const APPLICATION_ID = 'test-app-id-123'

  beforeEach(async () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const mockAdvertService = {
      // Add any methods you need
    }

    const mockApplicationModel = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
    }

    const mockAdvertModel = {
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecallApplicationService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IAdvertService,
          useValue: mockAdvertService,
        },
        {
          provide: getModelToken(ApplicationModel),
          useValue: mockApplicationModel,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
      ],
    }).compile()

    service = module.get<RecallApplicationService>(RecallApplicationService)
    advertModel = module.get(getModelToken(AdvertModel))
  })

  describe('getMinDateForDivisionMeeting', () => {
    it('should return next valid publishing date when no adverts exist', async () => {
      // Arrange - No division meeting found
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionMeeting(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      expect(typeof result.minDate).toBe('string')
    })

    it('should return 5 business days after previous division meeting when one exists', async () => {
      // Arrange - Previous division meeting found
      const mockDivisionMeeting = {
        id: 'advert-123',
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-10'),
            publishedAt: new Date('2026-01-10'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValueOnce(mockDivisionMeeting as any)

      // Act
      const result = await service.getMinDateForDivisionMeeting(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be 5 business days after 2026-01-10
      expect(new Date(result.minDate).getTime()).toBeGreaterThan(
        new Date('2026-01-10').getTime(),
      )
    })

    it('should return 63 days after first recall publication when no division meeting date exists', async () => {
      // Arrange - No division meeting, but recall advert exists
      jest.spyOn(advertModel, 'findOne').mockResolvedValueOnce(null) // No division meeting

      const mockRecallAdvert = {
        id: 'recall-advert-123',
        divisionMeetingDate: null,
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-05'),
            publishedAt: new Date('2026-01-05'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValueOnce(mockRecallAdvert as any)

      // Act
      const result = await service.getMinDateForDivisionMeeting(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be approximately 63 days after 2026-01-05
      expect(new Date(result.minDate).getTime()).toBeGreaterThanOrEqual(
        new Date('2026-01-05').getTime(),
      )
    })

    it('should return 5 business days after division meeting date from first recall advert', async () => {
      // Arrange - No separate division meeting, but recall advert has division meeting date
      jest.spyOn(advertModel, 'findOne').mockResolvedValueOnce(null) // No separate division meeting

      const mockRecallAdvert = {
        id: 'recall-advert-123',
        divisionMeetingDate: new Date('2026-02-01'),
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-05'),
            publishedAt: new Date('2026-01-05'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValueOnce(mockRecallAdvert as any)

      // Act
      const result = await service.getMinDateForDivisionMeeting(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be 5 business days after 2026-02-01
      expect(new Date(result.minDate).getTime()).toBeGreaterThan(
        new Date('2026-02-01').getTime(),
      )
    })
  })

  describe('getMinDateForDivisionEnding', () => {
    it('should return next business day after latest division meeting when it exists', async () => {
      // Arrange - Division meeting found
      const mockDivisionMeeting = {
        id: 'advert-123',
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-15'),
            publishedAt: new Date('2026-01-15'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValue(mockDivisionMeeting as any)

      // Act
      const result = await service.getMinDateForDivisionEnding(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be at least 1 business day after 2026-01-15
      expect(new Date(result.minDate).getTime()).toBeGreaterThan(
        new Date('2026-01-15').getTime(),
      )
    })

    it('should return 63 days after first recall publication when no division meeting exists', async () => {
      // Arrange - No division meeting, find first recall advert
      jest.spyOn(advertModel, 'findOne').mockResolvedValueOnce(null) // No division meeting

      const mockRecallAdvert = {
        id: 'recall-advert-123',
        divisionMeetingDate: null,
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-05'),
            publishedAt: new Date('2026-01-05'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValueOnce(mockRecallAdvert as any)

      // Act
      const result = await service.getMinDateForDivisionEnding(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be approximately 63 days after 2026-01-05
      expect(new Date(result.minDate).getTime()).toBeGreaterThanOrEqual(
        new Date('2026-01-05').getTime(),
      )
    })

    it('should return next business day after division meeting date from recall advert', async () => {
      // Arrange - No separate division meeting, but recall advert has division meeting date
      jest.spyOn(advertModel, 'findOne').mockResolvedValueOnce(null) // No division meeting

      const mockRecallAdvert = {
        id: 'recall-advert-123',
        divisionMeetingDate: new Date('2026-02-01'),
        createdAt: new Date('2026-01-01'),
        publications: [
          {
            id: 'pub-123',
            scheduledAt: new Date('2026-01-05'),
            publishedAt: new Date('2026-01-05'),
          },
        ],
      }
      jest
        .spyOn(advertModel, 'findOne')
        .mockResolvedValueOnce(mockRecallAdvert as any)

      // Act
      const result = await service.getMinDateForDivisionEnding(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      // Should be at least 1 business day after 2026-02-01
      expect(new Date(result.minDate).getTime()).toBeGreaterThan(
        new Date('2026-02-01').getTime(),
      )
    })

    it('should return next valid publishing date when no recall adverts exist', async () => {
      // Arrange - No adverts found at all
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionEnding(APPLICATION_ID)

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      expect(typeof result.minDate).toBe('string')
    })
  })
})
