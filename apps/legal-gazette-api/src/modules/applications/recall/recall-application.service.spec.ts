import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../../models/application.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { RecallApplicationService } from './recall-application.service'

describe('RecallApplicationService - Ownership Validation (H-2)', () => {
  let service: RecallApplicationService
  let applicationModel: typeof ApplicationModel
  let advertModel: typeof AdvertModel

  // Test data
  const OWNER_NATIONAL_ID = '1234567890'
  const OTHER_USER_NATIONAL_ID = '0987654321'
  const ADMIN_NATIONAL_ID = 'admin-123'
  const APPLICATION_ID = 'test-app-id-123'

  const mockOwnerUser: DMRUser = {
    nationalId: OWNER_NATIONAL_ID,
    name: 'Owner User',
    fullName: 'Owner User Full Name',
    scope: ['@logbirtingablad.is/lg-application-web'],
    client: 'test-client',
    authorization: 'Bearer token',
    actor: {
      nationalId: OWNER_NATIONAL_ID,
      name: 'Owner User',
      scope: ['@logbirtingablad.is/lg-application-web'],
    },
  }

  const mockOtherUser: DMRUser = {
    nationalId: OTHER_USER_NATIONAL_ID,
    name: 'Other User',
    fullName: 'Other User Full Name',
    scope: ['@logbirtingablad.is/lg-application-web'],
    client: 'test-client',
    authorization: 'Bearer token',
    actor: {
      nationalId: OTHER_USER_NATIONAL_ID,
      name: 'Other User',
      scope: ['@logbirtingablad.is/lg-application-web'],
    },
  }

  const mockAdminUser: DMRUser = {
    nationalId: ADMIN_NATIONAL_ID,
    name: 'Admin User',
    fullName: 'Admin User Full Name',
    scope: ['@logbirtingablad.is/admin'],
    client: 'test-client',
    authorization: 'Bearer token',
    actor: {
      nationalId: ADMIN_NATIONAL_ID,
      name: 'Admin User',
      scope: ['@logbirtingablad.is/admin'],
    },
  }

  const mockApplication = {
    id: APPLICATION_ID,
    applicantNationalId: OWNER_NATIONAL_ID,
    applicationType: ApplicationTypeEnum.RECALL_BANKRUPTCY,
    status: ApplicationStatusEnum.IN_PROGRESS,
    answers: {},
    currentStep: 1,
    caseId: 'case-123',
    settlementId: null,
    submittedByNationalId: null,
  }

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
    applicationModel = module.get(getModelToken(ApplicationModel))
    advertModel = module.get(getModelToken(AdvertModel))
  })

  describe('getMinDateForDivisionMeeting - Ownership Validation', () => {
    it('should throw NotFoundException when application does not exist', async () => {
      // Arrange
      jest.spyOn(applicationModel, 'findByPk').mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.getMinDateForDivisionMeeting(APPLICATION_ID, mockOwnerUser),
      ).rejects.toThrow(NotFoundException)
    })

    it('should allow owner to access their own application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionMeeting(
        APPLICATION_ID,
        mockOwnerUser,
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
    })

    it('should throw ForbiddenException when non-owner tries to access application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)

      // Act & Assert
      await expect(
        service.getMinDateForDivisionMeeting(APPLICATION_ID, mockOtherUser),
      ).rejects.toThrow(ForbiddenException)

      // Verify application was fetched for ownership check
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
    })

    it('should allow admin to access any application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionMeeting(
        APPLICATION_ID,
        mockAdminUser,
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
    })

    it('should check ownership before querying advert data', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      const advertSpy = jest.spyOn(advertModel, 'findOne')

      // Act & Assert
      await expect(
        service.getMinDateForDivisionMeeting(APPLICATION_ID, mockOtherUser),
      ).rejects.toThrow(ForbiddenException)

      // Verify ownership check happened first, before querying adverts
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
      expect(advertSpy).not.toHaveBeenCalled()
    })
  })

  describe('getMinDateForDivisionEnding - Ownership Validation', () => {
    it('should throw NotFoundException when application does not exist', async () => {
      // Arrange
      jest.spyOn(applicationModel, 'findByPk').mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.getMinDateForDivisionEnding(APPLICATION_ID, mockOwnerUser),
      ).rejects.toThrow(NotFoundException)
    })

    it('should allow owner to access their own application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionEnding(
        APPLICATION_ID,
        mockOwnerUser,
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
    })

    it('should throw ForbiddenException when non-owner tries to access application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)

      // Act & Assert
      await expect(
        service.getMinDateForDivisionEnding(APPLICATION_ID, mockOtherUser),
      ).rejects.toThrow(ForbiddenException)

      // Verify application was fetched for ownership check
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
    })

    it('should allow admin to access any application', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      jest.spyOn(advertModel, 'findOne').mockResolvedValue(null)

      // Act
      const result = await service.getMinDateForDivisionEnding(
        APPLICATION_ID,
        mockAdminUser,
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.minDate).toBeDefined()
    })

    it('should check ownership before querying advert data', async () => {
      // Arrange
      jest
        .spyOn(applicationModel, 'findByPk')
        .mockResolvedValue(mockApplication as any)
      const advertSpy = jest.spyOn(advertModel, 'findOne')

      // Act & Assert
      await expect(
        service.getMinDateForDivisionEnding(APPLICATION_ID, mockOtherUser),
      ).rejects.toThrow(ForbiddenException)

      // Verify ownership check happened first, before querying adverts
      expect(applicationModel.findByPk).toHaveBeenCalledWith(APPLICATION_ID)
      expect(advertSpy).not.toHaveBeenCalled()
    })
  })
})
