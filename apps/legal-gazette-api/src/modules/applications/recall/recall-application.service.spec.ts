/* eslint-disable @typescript-eslint/no-explicit-any */
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import {
  ApplicationTypeEnum,
  SettlementType,
} from '@dmr.is/legal-gazette-schemas'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel, AdvertTemplateType } from '../../../models/advert.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../../models/application.model'
import { CategoryDefaultIdEnum } from '../../../models/category.model'
import { TypeIdEnum } from '../../../models/type.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { RecallApplicationService } from './recall-application.service'

describe('RecallApplicationService', () => {
  let service: RecallApplicationService
  let advertModel: {
    findOne: jest.Mock
    findOneOrThrow: jest.Mock
  }
  let applicationModel: {
    findByPk: jest.Mock
    findOne: jest.Mock
    findOneOrThrow: jest.Mock
  }
  let advertService: {
    createAdvert: jest.Mock
  }
  const APPLICATION_ID = 'test-app-id-123'
  const mockUser = {
    name: 'Test User',
    nationalId: '0101302399',
  } as any

  const createMockSettlement = (overrides: Record<string, unknown> = {}) => ({
    id: 'settlement-123',
    type: SettlementType.DEFAULT,
    liquidatorName: 'Jane Liquidator',
    liquidatorLocation: 'Reykjavik',
    liquidatorRecallStatementLocation: 'Harbor 1',
    liquidatorRecallStatementType: 'LIQUIDATOR_LOCATION',
    name: 'Original Settlement',
    nationalId: '1111111111',
    address: 'Settlement Street 1',
    deadline: new Date('2026-03-01'),
    dateOfDeath: null,
    endingDate: null,
    declaredClaims: null,
    companies: undefined,
    update: jest.fn(),
    ...overrides,
  })

  const createMockApplication = (overrides: Record<string, unknown> = {}) => ({
    id: APPLICATION_ID,
    caseId: 'case-123',
    settlementId: 'settlement-123',
    settlement: createMockSettlement(),
    applicationType: ApplicationTypeEnum.RECALL_BANKRUPTCY,
    status: ApplicationStatusEnum.SUBMITTED,
    answers: {
      communicationChannels: [{ email: 'test@example.com' }],
    },
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  beforeEach(async () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    const mockAdvertService = {
      createAdvert: jest.fn(),
    }
    const mockApplicationModel = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      findOneOrThrow: jest.fn(),
    }
    const mockAdvertModel = {
      findOne: jest.fn(),
      findOneOrThrow: jest.fn(),
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
    applicationModel = module.get(getModelToken(ApplicationModel))
    advertService = module.get(IAdvertService)
  })

  afterEach(() => {
    jest.clearAllMocks()
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
      expect(result.minDate).toBeInstanceOf(Date)
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
      expect(result.minDate).toBeInstanceOf(Date)
    })
  })

  describe('addDivisionMeeting', () => {
    it('should clone the current settlement into a new advert settlement', async () => {
      const application = createMockApplication()

      applicationModel.findOneOrThrow.mockResolvedValue(application as any)
      advertService.createAdvert.mockResolvedValue({
        id: 'advert-456',
        settlement: { id: 'settlement-456' },
      })

      const body = {
        additionalText: 'Additional note',
        meetingDate: new Date('2026-04-08T10:00:00.000Z'),
        meetingLocation: 'Court House',
        signature: {
          date: new Date('2026-04-01T10:00:00.000Z'),
          name: 'Lawyer',
          location: 'Reykjavik',
          onBehalfOf: null,
        },
      }

      await service.addDivisionMeeting(APPLICATION_ID, body, mockUser)

      const createAdvertCall = advertService.createAdvert.mock.calls[0][0]

      expect(createAdvertCall).toEqual(
        expect.objectContaining({
          applicationId: APPLICATION_ID,
          typeId: TypeIdEnum.DIVISION_MEETING,
          categoryId: CategoryDefaultIdEnum.DIVISION_MEETINGS,
          templateType: AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY,
          title: 'Skiptafundur - Original Settlement',
          settlement: {
            settlementType: SettlementType.DEFAULT,
            liquidatorName: 'Jane Liquidator',
            liquidatorLocation: 'Reykjavik',
            recallRequirementStatementLocation: 'Harbor 1',
            recallRequirementStatementType: 'LIQUIDATOR_LOCATION',
            name: 'Original Settlement',
            nationalId: '1111111111',
            address: 'Settlement Street 1',
            deadline: new Date('2026-03-01'),
            dateOfDeath: undefined,
            endingDate: undefined,
            declaredClaims: undefined,
            companies: undefined,
          },
        }),
      )
      expect(createAdvertCall.settlementId).toBeUndefined()
      expect(application.update).toHaveBeenCalledWith({
        settlementId: 'settlement-456',
      })
    })
  })

  describe('addDivisionEnding', () => {
    it('should clone the current settlement with ending overrides instead of mutating the previous settlement', async () => {
      const settlement = createMockSettlement({
        declaredClaims: 12,
        endingDate: new Date('2026-04-20T00:00:00.000Z'),
      })
      const application = createMockApplication({
        applicationType: ApplicationTypeEnum.RECALL_DECEASED,
        settlement,
      })

      applicationModel.findOne.mockResolvedValue(application as any)
      advertModel.findOneOrThrow.mockResolvedValue({
        judgementDate: new Date('2026-03-15T00:00:00.000Z'),
      })
      advertService.createAdvert.mockResolvedValue({
        id: 'advert-789',
        settlement: { id: 'settlement-789' },
      })

      const body = {
        additionalText: 'Wrap up',
        content: '<p>Division ending content</p>',
        declaredClaims: 345,
        endingDate: new Date('2026-05-01T00:00:00.000Z'),
        scheduledAt: new Date('2026-05-05T00:00:00.000Z'),
        signature: {
          date: new Date('2026-05-01T00:00:00.000Z'),
          name: 'Lawyer',
          location: 'Akureyri',
          onBehalfOf: null,
        },
      }

      await service.addDivisionEnding(APPLICATION_ID, body, mockUser)

      const createAdvertCall = advertService.createAdvert.mock.calls[0][0]

      expect(createAdvertCall).toEqual(
        expect.objectContaining({
          applicationId: APPLICATION_ID,
          typeId: TypeIdEnum.DIVISION_ENDING,
          categoryId: CategoryDefaultIdEnum.DIVISION_ENDINGS,
          templateType: AdvertTemplateType.DIVISION_ENDING,
          title: 'Skiptalok - Original Settlement',
          settlement: {
            settlementType: SettlementType.DEFAULT,
            liquidatorName: 'Jane Liquidator',
            liquidatorLocation: 'Reykjavik',
            recallRequirementStatementLocation: 'Harbor 1',
            recallRequirementStatementType: 'LIQUIDATOR_LOCATION',
            name: 'Original Settlement',
            nationalId: '1111111111',
            address: 'Settlement Street 1',
            deadline: new Date('2026-03-01'),
            dateOfDeath: undefined,
            endingDate: new Date('2026-05-01T00:00:00.000Z'),
            declaredClaims: 345,
            companies: undefined,
          },
        }),
      )
      expect(createAdvertCall.settlementId).toBeUndefined()
      expect(settlement.update).not.toHaveBeenCalled()
      expect(application.update).toHaveBeenCalledWith({
        status: ApplicationStatusEnum.FINISHED,
        settlementId: 'settlement-789',
      })
    })
  })
})
