import { Sequelize } from 'sequelize-typescript'

import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel, UpdateAdvertDto } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { StatusIdEnum } from '../../models/status.model'
import { UserModel } from '../../models/users.model'
import { ILGNationalRegistryService } from '../national-registry/national-registry.service.interface'
import { ITypeCategoriesService } from '../type-categories/type-categories.service.interface'
import { AdvertService } from './advert.service'

// ==========================================
// Mock Factories
// ==========================================

interface MockAdvert {
  id: string
  statusId: StatusIdEnum
  title: string
  content: string
  categoryId: string
  typeId: string
  fromModelToDetailed: () => unknown
  update: jest.Mock
}

const createMockAdvert = (overrides: Partial<MockAdvert> = {}): MockAdvert => {
  const advert: MockAdvert = {
    id: overrides.id || 'advert-123',
    statusId: overrides.statusId || StatusIdEnum.SUBMITTED,
    title: overrides.title || 'Test Advert',
    content: overrides.content || '<p>Test content</p>',
    categoryId: overrides.categoryId || 'category-123',
    typeId: overrides.typeId || 'type-123',
    fromModelToDetailed: jest.fn().mockReturnValue({
      id: overrides.id || 'advert-123',
      title: overrides.title || 'Test Advert',
      content: overrides.content || '<p>Test content</p>',
      statusId: overrides.statusId || StatusIdEnum.SUBMITTED,
    }),
    update: jest.fn(),
  }

  // Make update return the updated advert
  advert.update.mockImplementation((updates: Partial<MockAdvert>) => {
    Object.assign(advert, updates)
    return advert
  })

  return advert
}

const createMockUpdateDto = (overrides: Partial<UpdateAdvertDto> = {}): UpdateAdvertDto => ({
  title: 'Updated Title',
  content: '<p>Updated content</p>',
  ...overrides,
})

const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})

// ==========================================
// Test Suite
// ==========================================

describe('AdvertService', () => {
  let service: AdvertService
  let advertModel: {
    withScope: jest.Mock
    unscoped: jest.Mock
    findByPkOrThrow: jest.Mock
  }
  let typeCategoriesService: jest.Mocked<ITypeCategoriesService>

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock AdvertModel
    const mockAdvertModel = {
      withScope: jest.fn().mockReturnThis(),
      unscoped: jest.fn().mockReturnThis(),
      findByPkOrThrow: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
    }

    // Mock TypeCategoriesService
    const mockTypeCategoriesService = {
      findByTypeId: jest.fn().mockResolvedValue({
        type: {
          categories: [{ id: 'category-123' }],
        },
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertService,
        {
          provide: LOGGER_PROVIDER,
          useValue: createMockLogger(),
        },
        {
          provide: ILGNationalRegistryService,
          useValue: {
            getEntityNameByNationalId: jest.fn().mockResolvedValue('Test Entity'),
          },
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
        {
          provide: getModelToken(UserModel),
          useValue: {
            unscoped: jest.fn().mockReturnThis(),
            findOneOrThrow: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {},
        },
        {
          provide: ITypeCategoriesService,
          useValue: mockTypeCategoriesService,
        },
        {
          provide: getModelToken(CaseModel),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(ApplicationModel),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn().mockImplementation(async (callback) => {
              const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn(),
                afterCommit: jest.fn((cb) => cb()),
              }
              return callback(mockTransaction)
            }),
          },
        },
      ],
    }).compile()

    service = module.get<AdvertService>(AdvertService)
    advertModel = module.get(getModelToken(AdvertModel))
    typeCategoriesService = module.get(ITypeCategoriesService)
  })

  // ==========================================
  // C-1: Published Adverts Modification Prevention
  // ==========================================
  describe('updateAdvert', () => {
    describe('when advert is PUBLISHED (C-1 Critical Issue)', () => {
      it('should throw BadRequestException when trying to modify title of published advert', async () => {
        // Arrange: Create a published advert
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          title: 'Original Title',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ title: 'New Title' })

        // Act & Assert: Should throw BadRequestException
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )

        // Verify update was NOT called
        expect(publishedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when trying to modify content of published advert', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          content: '<p>Original content</p>',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ content: '<p>Modified content</p>' })

        // Act & Assert
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )

        expect(publishedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when trying to modify category of published advert', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          categoryId: 'original-category',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ categoryId: 'new-category' })

        // Act & Assert
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )

        expect(publishedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when trying to modify type of published advert', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          typeId: 'original-type',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ typeId: 'new-type' })

        // Act & Assert
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )

        expect(publishedAdvert.update).not.toHaveBeenCalled()
        expect(typeCategoriesService.findByTypeId).not.toHaveBeenCalled()
      })

      it('should include BadRequestException type in error', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto()

        // Act & Assert: Verify it's specifically a BadRequestException
        try {
          await service.updateAdvert('advert-123', updateDto)
          fail('Expected BadRequestException to be thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).name).toBe('BadRequestException')
        }
      })
    })

    describe('when advert is REJECTED', () => {
      it('should throw BadRequestException when trying to modify rejected advert', async () => {
        // Arrange
        const rejectedAdvert = createMockAdvert({
          statusId: StatusIdEnum.REJECTED,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(rejectedAdvert)

        const updateDto = createMockUpdateDto()

        // Act & Assert
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )
      })
    })

    describe('when advert is WITHDRAWN', () => {
      it('should throw BadRequestException when trying to modify withdrawn advert', async () => {
        // Arrange
        const withdrawnAdvert = createMockAdvert({
          statusId: StatusIdEnum.WITHDRAWN,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(withdrawnAdvert)

        const updateDto = createMockUpdateDto()

        // Act & Assert
        await expect(service.updateAdvert('advert-123', updateDto)).rejects.toThrow(
          'Cannot modify published adverts',
        )
      })
    })

    describe('when advert is in editable status', () => {
      it('should allow modification when status is SUBMITTED', async () => {
        // Arrange
        const submittedAdvert = createMockAdvert({
          statusId: StatusIdEnum.SUBMITTED,
          title: 'Original Title',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(submittedAdvert)

        const updateDto = createMockUpdateDto({ title: 'Updated Title' })

        // Act
        const result = await service.updateAdvert('advert-123', updateDto)

        // Assert
        expect(submittedAdvert.update).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated Title',
          }),
        )
        expect(result).toBeDefined()
      })

      it('should allow modification when status is IN_PROGRESS', async () => {
        // Arrange
        const inProgressAdvert = createMockAdvert({
          statusId: StatusIdEnum.IN_PROGRESS,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(inProgressAdvert)

        const updateDto = createMockUpdateDto({ title: 'Updated Title' })

        // Act
        const result = await service.updateAdvert('advert-123', updateDto)

        // Assert
        expect(inProgressAdvert.update).toHaveBeenCalled()
        expect(result).toBeDefined()
      })

      it('should allow modification when status is READY_FOR_PUBLICATION', async () => {
        // Arrange
        const readyAdvert = createMockAdvert({
          statusId: StatusIdEnum.READY_FOR_PUBLICATION,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(readyAdvert)

        const updateDto = createMockUpdateDto({ content: '<p>Updated content</p>' })

        // Act
        const result = await service.updateAdvert('advert-123', updateDto)

        // Assert
        expect(readyAdvert.update).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '<p>Updated content</p>',
          }),
        )
        expect(result).toBeDefined()
      })
    })

    describe('field updates when allowed', () => {
      beforeEach(() => {
        const editableAdvert = createMockAdvert({
          statusId: StatusIdEnum.SUBMITTED,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(editableAdvert)
      })

      it('should update typeId and fetch corresponding category', async () => {
        // Arrange
        const updateDto = createMockUpdateDto({ typeId: 'new-type-id' })
        typeCategoriesService.findByTypeId.mockResolvedValue({
          type: {
            id: 'new-type-id',
            title: 'Test Type',
            slug: 'test-type',
            categories: [{ id: 'derived-category-id', title: 'Test Category', slug: 'test-cat' }],
          },
        })

        // Act
        await service.updateAdvert('advert-123', updateDto)

        // Assert
        expect(typeCategoriesService.findByTypeId).toHaveBeenCalledWith('new-type-id')
      })

      it('should update caption when provided', async () => {
        // Arrange
        const updateDto = createMockUpdateDto({ caption: 'New Caption' })

        // Act
        await service.updateAdvert('advert-123', updateDto)

        // Assert
        const advert = await advertModel.findByPkOrThrow('advert-123')
        expect(advert.update).toHaveBeenCalledWith(
          expect.objectContaining({
            caption: 'New Caption',
          }),
        )
      })
    })
  })
})
