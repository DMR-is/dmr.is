import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { type DMRUser } from '@dmr.is/auth/dmrUser'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ApplicationModel,
  ApplicationStatusEnum,
  UpdateApplicationDto,
} from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { CategoryModel } from '../../models/category.model'
import { IAdvertService } from '../advert/advert.service.interface'
import { IRecallApplicationService } from './recall/recall-application.service.interface'
import { ApplicationService } from './application.service'
// Test user factory
const createTestUser = (nationalId = '1234567890'): DMRUser => ({
  nationalId,
  name: 'Test User',
  fullName: 'Test User',
  scope: ['@logbirtingablad.is/lg-application-web'],
  client: 'test-client',
  authorization: 'Bearer test-token',
})
// Mock application factory
const createMockApplication = (
  overrides: Partial<ApplicationModel> = {},
): Partial<ApplicationModel> => ({
  id: 'app-123',
  caseId: 'case-123',
  applicantNationalId: '1234567890',
  applicationType: ApplicationTypeEnum.COMMON,
  status: ApplicationStatusEnum.DRAFT,
  answers: {},
  currentStep: 1,
  submittedByNationalId: null,
  settlementId: null,
  update: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined),
  fromModelToDetailedDto: jest.fn().mockReturnValue({
    id: 'app-123',
    status: ApplicationStatusEnum.DRAFT,
  }),
  ...overrides,
})
describe('ApplicationService - Status Validation', () => {
  let service: ApplicationService
  let applicationModel: any
  let advertService: any
  beforeEach(async () => {
    const mockApplicationModel = {
      findByPkOrThrow: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      scope: jest.fn().mockReturnThis(),
      findAndCountAll: jest.fn(),
    }
    const mockAdvertService = {
      createAdvert: jest.fn().mockResolvedValue({ id: 'advert-123' }),
    }
    const mockRecallApplicationService = {
      createRecallBankruptcyApplicationAndAdvert: jest.fn(),
      createRecallDeceasedApplicationAndAdvert: jest.fn(),
    }
    const mockCaseModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
    }
    const mockCategoryModel = {
      findByPkOrThrow: jest.fn(),
    }
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: getModelToken(ApplicationModel),
          useValue: mockApplicationModel,
        },
        { provide: getModelToken(CaseModel), useValue: mockCaseModel },
        { provide: getModelToken(CategoryModel), useValue: mockCategoryModel },
        { provide: IAdvertService, useValue: mockAdvertService },
        {
          provide: IRecallApplicationService,
          useValue: mockRecallApplicationService,
        },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
      ],
    }).compile()
    service = module.get<ApplicationService>(ApplicationService)
    applicationModel = module.get(getModelToken(ApplicationModel))
    advertService = module.get(IAdvertService)
  })
  describe('submitApplication - Status Check Validation', () => {
    // Note: These tests focus on status validation, not full schema validation
    // They should fail BEFORE reaching Zod schema parsing
    it('should throw BadRequestException when application is already SUBMITTED', async () => {
      // Setup: Create application with SUBMITTED status
      const submittedApplication = createMockApplication({
        status: ApplicationStatusEnum.SUBMITTED,
        applicationType: ApplicationTypeEnum.COMMON,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(submittedApplication)
      const user = createTestUser()
      // Action & Assert: Should throw BadRequestException BEFORE schema validation
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        /Cannot submit application with status 'SUBMITTED'/,
      )
      // Verify submission logic was NOT called
      expect(advertService.createAdvert).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when application is IN_PROGRESS', async () => {
      // Setup: Create application with IN_PROGRESS status
      const inProgressApplication = createMockApplication({
        status: ApplicationStatusEnum.IN_PROGRESS,
        applicationType: ApplicationTypeEnum.COMMON,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(inProgressApplication)
      const user = createTestUser()
      // Action & Assert: Should throw BadRequestException BEFORE schema validation
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        /Cannot submit application with status 'IN_PROGRESS'/,
      )
      expect(advertService.createAdvert).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when application is FINISHED', async () => {
      // Setup: Create application with FINISHED status
      const finishedApplication = createMockApplication({
        status: ApplicationStatusEnum.FINISHED,
        applicationType: ApplicationTypeEnum.COMMON,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(finishedApplication)
      const user = createTestUser()
      // Action & Assert: Should throw BadRequestException BEFORE schema validation
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.submitApplication('app-123', user)).rejects.toThrow(
        /Cannot submit application with status 'FINISHED'/,
      )
      expect(advertService.createAdvert).not.toHaveBeenCalled()
    })
  })
  describe('updateApplication - Status Check Validation', () => {
    it('should allow updates when application status is DRAFT', async () => {
      // Setup: Create DRAFT application
      const draftApplication = createMockApplication({
        status: ApplicationStatusEnum.DRAFT,
        applicationType: ApplicationTypeEnum.COMMON,
        answers: {
          fields: {
            caption: 'Original Caption',
          },
        },
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(draftApplication)
      const updateDto: UpdateApplicationDto = {
        currentStep: 2,
        answers: {
          fields: {
            caption: 'Updated Caption',
          },
        },
      }
      // Action: Update the application
      const result = await service.updateApplication('app-123', updateDto)
      // Assert: Application should be updated
      expect(draftApplication.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should preserve signature.date as null when explicitly set to null', async () => {
      // Setup: Create DRAFT application with existing signature data
      const draftApplication = createMockApplication({
        status: ApplicationStatusEnum.DRAFT,
        applicationType: ApplicationTypeEnum.COMMON,
        answers: {
          fields: {
            caption: 'Test Caption',
          },
          signature: {
            name: 'John Doe',
            location: 'Reykjavík',
            date: '2024-01-15',
            onBehalfOf: null,
          },
        },
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(draftApplication)
      // User updates signature but sets date to null
      const updateDto: UpdateApplicationDto = {
        currentStep: 3,
        answers: {
          signature: {
            name: 'John Doe',
            location: 'Reykjavík',
            date: null, // Explicitly set to null
            onBehalfOf: null,
          },
        },
      }
      // Action: Update the application
      const result = await service.updateApplication('app-123', updateDto)
      // Assert: Application should be updated with null date
      expect(draftApplication.update).toHaveBeenCalled()
      const updateCall = (draftApplication.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.answers.signature.date).toBeNull()
    })
    it('should handle signature with null date when other fields are present', async () => {
      // Setup: Application with signature containing null date but valid name
      const draftApplication = createMockApplication({
        status: ApplicationStatusEnum.DRAFT,
        applicationType: ApplicationTypeEnum.COMMON,
        answers: {
          fields: {
            caption: 'Test Caption',
          },
          signature: {
            name: 'Jane Smith',
            location: 'Akureyri',
            date: null, // Date is null
            onBehalfOf: 'Company X',
          },
        },
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(draftApplication)
      const updateDto: UpdateApplicationDto = {
        currentStep: 3,
        answers: {
          fields: {
            caption: 'Updated Caption',
          },
        },
      }
      // Action: Update the application (not modifying signature)
      const result = await service.updateApplication('app-123', updateDto)
      // Assert: Signature with null date should remain in answers
      expect(draftApplication.update).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should allow updating signature with date changing from valid to null', async () => {
      // Reproduces production issue: User had a date, but it becomes null
      const draftApplication = createMockApplication({
        status: ApplicationStatusEnum.DRAFT,
        applicationType: ApplicationTypeEnum.COMMON,
        answers: {
          fields: {
            caption: 'Test Caption',
          },
          signature: {
            name: 'Test User',
            location: 'Reykjavík',
            date: '2024-01-20', // User initially set a date
            onBehalfOf: null,
          },
        },
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(draftApplication)
      // Simulating the production issue: date becomes null despite user setting it
      const updateDto: UpdateApplicationDto = {
        currentStep: 4,
        answers: {
          signature: {
            name: 'Test User',
            location: 'Reykjavík',
            date: null, // Date is now null (potential bug in frontend or API layer)
            onBehalfOf: null,
          },
        },
      }
      // Action: Update application
      const result = await service.updateApplication('app-123', updateDto)
      // Assert: The update succeeds but date is null
      expect(draftApplication.update).toHaveBeenCalled()
      const updateCall = (draftApplication.update as jest.Mock).mock.calls[0][0]
      // This test documents the current behavior where null overwrites the previous value
      // If this is unintended, the service should validate or preserve the previous date
      expect(updateCall.answers.signature.date).toBeNull()
    })
    it('should throw BadRequestException when application is SUBMITTED', async () => {
      // Setup: Create SUBMITTED application
      const submittedApplication = createMockApplication({
        status: ApplicationStatusEnum.SUBMITTED,
        applicationType: ApplicationTypeEnum.RECALL_BANKRUPTCY,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(submittedApplication)
      const updateDto: UpdateApplicationDto = {
        currentStep: 2,
        answers: {
          fields: {
            caption: 'Trying to update',
          },
        },
      }
      // Action & Assert: Should throw BadRequestException
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(/Cannot modify application with status 'SUBMITTED'/)
      expect(submittedApplication.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when application is IN_PROGRESS', async () => {
      // Setup: Create IN_PROGRESS application
      const inProgressApplication = createMockApplication({
        status: ApplicationStatusEnum.IN_PROGRESS,
        applicationType: ApplicationTypeEnum.COMMON,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(inProgressApplication)
      const updateDto: UpdateApplicationDto = {
        currentStep: 2,
        answers: {},
      }
      // Action & Assert: Should throw BadRequestException
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(/Cannot modify application with status 'IN_PROGRESS'/)
      expect(inProgressApplication.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when application is FINISHED', async () => {
      // Setup: Create FINISHED application
      const finishedApplication = createMockApplication({
        status: ApplicationStatusEnum.FINISHED,
        applicationType: ApplicationTypeEnum.COMMON,
      })
      applicationModel.findByPkOrThrow.mockResolvedValue(finishedApplication)
      const updateDto: UpdateApplicationDto = {
        currentStep: 2,
        answers: {},
      }
      // Action & Assert: Should throw BadRequestException
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateApplication('app-123', updateDto),
      ).rejects.toThrow(/Cannot modify application with status 'FINISHED'/)
      expect(finishedApplication.update).not.toHaveBeenCalled()
    })
  })
})
