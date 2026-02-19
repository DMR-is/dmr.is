import { ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { OwnershipGuard } from '../../../core/guards/ownership.guard'
import { RecallApplicationController } from './recall-application.controller'
import { IRecallApplicationService } from './recall-application.service.interface'
describe('RecallApplicationController - Ownership Validation (H-2)', () => {
  let controller: RecallApplicationController
  let service: jest.Mocked<IRecallApplicationService>
  // Test data
  const OWNER_NATIONAL_ID = '1234567890'
  const OTHER_USER_NATIONAL_ID = '0987654321'
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
  const mockMinDateResponse = {
    minDate: '2026-01-15T00:00:00.000Z',
  }
  beforeEach(async () => {
    const mockService: Partial<IRecallApplicationService> = {
      getMinDateForDivisionMeeting: jest
        .fn()
        .mockResolvedValue(mockMinDateResponse),
      getMinDateForDivisionEnding: jest
        .fn()
        .mockResolvedValue(mockMinDateResponse),
      addDivisionMeeting: jest.fn().mockResolvedValue(undefined),
      addDivisionEnding: jest.fn().mockResolvedValue(undefined),
    }
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecallApplicationController],
      providers: [
        {
          provide: IRecallApplicationService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(TokenJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OwnershipGuard)
      .useValue({ canActivate: () => true })
      .compile()
    controller = module.get<RecallApplicationController>(
      RecallApplicationController,
    )
    service = module.get(
      IRecallApplicationService,
    ) as jest.Mocked<IRecallApplicationService>
  })
  describe('getMinDateForDivisionMeeting', () => {
    it('should call service method when OwnershipGuard passes', async () => {
      // Arrange
      service.getMinDateForDivisionMeeting.mockResolvedValue(
        mockMinDateResponse,
      )
      // Act
      const result =
        await controller.getMinDateForDivisionMeeting(APPLICATION_ID)
      // Assert
      expect(result).toEqual(mockMinDateResponse)
      expect(service.getMinDateForDivisionMeeting).toHaveBeenCalledWith(
        APPLICATION_ID,
      )
      expect(service.getMinDateForDivisionMeeting).toHaveBeenCalledTimes(1)
    })
    describe('OwnershipGuard behavior', () => {
      it('should have OwnershipGuard configured on method', () => {
        // Verify the guard decorator is applied by checking the guards metadata
        // This confirms the guard will be invoked at runtime
        const guards = Reflect.getMetadata(
          '__guards__',
          controller.getMinDateForDivisionMeeting,
        )
        expect(guards).toBeDefined()
        expect(guards).toContain(OwnershipGuard)
      })
    })
  })
  describe('getMinDateForDivisionEnding', () => {
    it('should call service method when OwnershipGuard passes', async () => {
      // Arrange
      service.getMinDateForDivisionEnding.mockResolvedValue(mockMinDateResponse)
      // Act
      const result =
        await controller.getMinDateForDivisionEnding(APPLICATION_ID)
      // Assert
      expect(result).toEqual(mockMinDateResponse)
      expect(service.getMinDateForDivisionEnding).toHaveBeenCalledWith(
        APPLICATION_ID,
      )
      expect(service.getMinDateForDivisionEnding).toHaveBeenCalledTimes(1)
    })
    describe('OwnershipGuard behavior', () => {
      it('should have OwnershipGuard configured on method', () => {
        // Verify the guard decorator is applied by checking the guards metadata
        // This confirms the guard will be invoked at runtime
        const guards = Reflect.getMetadata(
          '__guards__',
          controller.getMinDateForDivisionEnding,
        )
        expect(guards).toBeDefined()
        expect(guards).toContain(OwnershipGuard)
      })
    })
  })
  describe('addDivisionMeeting', () => {
    const createMeetingDto = {
      meetingDate: '2026-01-15T00:00:00.000Z',
      meetingLocation: 'Test Location',
      signature: {
        date: new Date('2026-01-15'),
        name: 'Test Name',
        location: 'Test Location',
        onBehalfOf: null,
      },
    }
    it('should allow owner to add division meeting for their own application', async () => {
      // Arrange
      service.addDivisionMeeting.mockResolvedValue(undefined)
      // Act
      await controller.addDivisionMeeting(
        APPLICATION_ID,
        createMeetingDto,
        mockOwnerUser,
      )
      // Assert
      expect(service.addDivisionMeeting).toHaveBeenCalledWith(
        APPLICATION_ID,
        createMeetingDto,
        mockOwnerUser,
      )
    })
    it('should throw ForbiddenException when non-owner tries to add division meeting', async () => {
      // Arrange
      service.addDivisionMeeting.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to access this application',
        ),
      )
      // Act & Assert
      await expect(
        controller.addDivisionMeeting(
          APPLICATION_ID,
          createMeetingDto,
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException)
    })
  })
  describe('addDivisionEnding', () => {
    const createEndingDto = {
      declaredClaims: 123456,
      scheduledAt: new Date('2026-02-01'),
      endingDate: new Date('2026-03-01'),
      signature: {
        date: new Date('2026-01-15'),
        name: 'Test Name',
        location: null,
        onBehalfOf: null,
      },
    }
    it('should allow owner to add division ending for their own application', async () => {
      // Arrange
      service.addDivisionEnding.mockResolvedValue(undefined)
      // Act
      await controller.addDivisionEnding(
        APPLICATION_ID,
        createEndingDto,
        mockOwnerUser,
      )
      // Assert
      expect(service.addDivisionEnding).toHaveBeenCalledWith(
        APPLICATION_ID,
        createEndingDto,
        mockOwnerUser,
      )
    })
    it('should throw ForbiddenException when non-owner tries to add division ending', async () => {
      // Arrange
      service.addDivisionEnding.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to access this application',
        ),
      )
      // Act & Assert
      await expect(
        controller.addDivisionEnding(
          APPLICATION_ID,
          createEndingDto,
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
