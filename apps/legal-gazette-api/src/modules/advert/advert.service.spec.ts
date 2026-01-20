import { Op } from 'sequelize'
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
  assignedUserId: string | null
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
    assignedUserId: overrides.assignedUserId ?? null,
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

const createMockUpdateDto = (
  overrides: Partial<UpdateAdvertDto> = {},
): UpdateAdvertDto => ({
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

interface MockUser {
  id: string
  nationalId: string
}

const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: overrides.id || 'user-123',
  nationalId: overrides.nationalId || '1234567890',
})

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
const createMockDMRUser = (nationalId: string = '1234567890') => ({
  nationalId,
  name: 'Test User',
  scope: ['@logbirtingablad.is/logbirtingabladid'],
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
    scope: jest.Mock
    findAndCountAll: jest.Mock
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
      scope: jest.fn().mockReturnThis(),
      findAndCountAll: jest.fn(),
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
            getEntityNameByNationalId: jest
              .fn()
              .mockResolvedValue('Test Entity'),
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
            literal: jest.fn((sql: string) => ({ val: sql })),
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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ title: 'New Title' })

        // Act & Assert: Should throw BadRequestException
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')

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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({
          content: '<p>Modified content</p>',
        })

        // Act & Assert
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')

        expect(publishedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when trying to modify category of published advert', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          categoryId: 'original-category',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ categoryId: 'new-category' })

        // Act & Assert
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')

        expect(publishedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when trying to modify type of published advert', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
          typeId: 'original-type',
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(publishedAdvert)

        const updateDto = createMockUpdateDto({ typeId: 'new-type' })

        // Act & Assert
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')

        expect(publishedAdvert.update).not.toHaveBeenCalled()
        expect(typeCategoriesService.findByTypeId).not.toHaveBeenCalled()
      })

      it('should include BadRequestException type in error', async () => {
        // Arrange
        const publishedAdvert = createMockAdvert({
          statusId: StatusIdEnum.PUBLISHED,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(publishedAdvert)

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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const updateDto = createMockUpdateDto()

        // Act & Assert
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')
      })
    })

    describe('when advert is WITHDRAWN', () => {
      it('should throw BadRequestException when trying to modify withdrawn advert', async () => {
        // Arrange
        const withdrawnAdvert = createMockAdvert({
          statusId: StatusIdEnum.WITHDRAWN,
        })
        advertModel.withScope.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(withdrawnAdvert)

        const updateDto = createMockUpdateDto()

        // Act & Assert
        await expect(
          service.updateAdvert('advert-123', updateDto),
        ).rejects.toThrow('Cannot modify published adverts')
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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(submittedAdvert)

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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(inProgressAdvert)

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

        const updateDto = createMockUpdateDto({
          content: '<p>Updated content</p>',
        })

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
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(editableAdvert)
      })

      it('should update typeId and fetch corresponding category', async () => {
        // Arrange
        const updateDto = createMockUpdateDto({ typeId: 'new-type-id' })
        typeCategoriesService.findByTypeId.mockResolvedValue({
          type: {
            id: 'new-type-id',
            title: 'Test Type',
            slug: 'test-type',
            categories: [
              {
                id: 'derived-category-id',
                title: 'Test Category',
                slug: 'test-cat',
              },
            ],
          },
        })

        // Act
        await service.updateAdvert('advert-123', updateDto)

        // Assert
        expect(typeCategoriesService.findByTypeId).toHaveBeenCalledWith(
          'new-type-id',
        )
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

  // ==========================================
  // reactivateAdvert - Reactivate rejected adverts
  // ==========================================
  describe('reactivateAdvert', () => {
    let userModel: {
      unscoped: jest.Mock
      findOneOrThrow: jest.Mock
    }
    let eventEmitter: {
      emit: jest.Mock
    }

    beforeEach(async () => {
      // Get mocks from module
      const module = await Test.createTestingModule({
        providers: [
          AdvertService,
          {
            provide: LOGGER_PROVIDER,
            useValue: createMockLogger(),
          },
          {
            provide: ILGNationalRegistryService,
            useValue: {
              getEntityNameByNationalId: jest
                .fn()
                .mockResolvedValue('Test Entity'),
            },
          },
          {
            provide: getModelToken(AdvertModel),
            useValue: {
              withScope: jest.fn().mockReturnThis(),
              unscoped: jest.fn().mockReturnThis(),
              findByPkOrThrow: jest.fn(),
            },
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
            useValue: {
              findByTypeId: jest.fn(),
            },
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
      userModel = module.get(getModelToken(UserModel))
      eventEmitter = module.get(EventEmitter2)
    })

    describe('when advert is REJECTED and user is assigned', () => {
      it('should successfully reactivate the advert to IN_PROGRESS status', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const rejectedAdvert = createMockAdvert({
          id: 'advert-123',
          statusId: StatusIdEnum.REJECTED,
          assignedUserId: 'user-123',
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act
        await service.reactivateAdvert('advert-123', currentUser as any)

        // Assert
        expect(rejectedAdvert.update).toHaveBeenCalledWith({
          statusId: StatusIdEnum.IN_PROGRESS,
        })
      })

      it('should emit STATUS_CHANGED event after successful reactivation', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const rejectedAdvert = createMockAdvert({
          id: 'advert-123',
          statusId: StatusIdEnum.REJECTED,
          assignedUserId: 'user-123',
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act
        await service.reactivateAdvert('advert-123', currentUser as any)

        // Assert
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'advert.status.changed',
          expect.objectContaining({
            advertId: 'advert-123',
            actorId: '1234567890',
            statusId: StatusIdEnum.IN_PROGRESS,
          }),
        )
      })
    })

    describe('when advert is not REJECTED', () => {
      it.each([
        { status: StatusIdEnum.SUBMITTED, name: 'SUBMITTED' },
        { status: StatusIdEnum.IN_PROGRESS, name: 'IN_PROGRESS' },
        {
          status: StatusIdEnum.READY_FOR_PUBLICATION,
          name: 'READY_FOR_PUBLICATION',
        },
        { status: StatusIdEnum.PUBLISHED, name: 'PUBLISHED' },
        { status: StatusIdEnum.WITHDRAWN, name: 'WITHDRAWN' },
      ])(
        'should throw BadRequestException when status is $name',
        async ({ status }) => {
          // Arrange
          const mockUser = createMockUser({
            id: 'user-123',
            nationalId: '1234567890',
          })
          const advert = createMockAdvert({
            id: 'advert-123',
            statusId: status,
            assignedUserId: 'user-123',
          })

          userModel.unscoped.mockReturnThis()
          userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
          advertModel.unscoped.mockReturnThis()
          advertModel.findByPkOrThrow = jest.fn().mockResolvedValue(advert)

          const currentUser = createMockDMRUser('1234567890')

          // Act & Assert
          await expect(
            service.reactivateAdvert('advert-123', currentUser as any),
          ).rejects.toThrow('Only rejected adverts can be reactivated')

          // Verify update was NOT called
          expect(advert.update).not.toHaveBeenCalled()
        },
      )
    })

    describe('when user is not assigned to the advert', () => {
      it('should throw BadRequestException when user is not assigned', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const rejectedAdvert = createMockAdvert({
          id: 'advert-123',
          statusId: StatusIdEnum.REJECTED,
          assignedUserId: 'different-user-456', // Different user is assigned
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act & Assert
        await expect(
          service.reactivateAdvert('advert-123', currentUser as any),
        ).rejects.toThrow('User is not assigned to this advert')

        // Verify update was NOT called
        expect(rejectedAdvert.update).not.toHaveBeenCalled()
      })

      it('should throw BadRequestException when no user is assigned', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const rejectedAdvert = createMockAdvert({
          id: 'advert-123',
          statusId: StatusIdEnum.REJECTED,
          assignedUserId: null, // No user assigned
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act & Assert
        await expect(
          service.reactivateAdvert('advert-123', currentUser as any),
        ).rejects.toThrow('User is not assigned to this advert')

        // Verify update was NOT called
        expect(rejectedAdvert.update).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should include BadRequestException type in status validation error', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const submittedAdvert = createMockAdvert({
          statusId: StatusIdEnum.SUBMITTED,
          assignedUserId: 'user-123',
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(submittedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act & Assert
        try {
          await service.reactivateAdvert('advert-123', currentUser as any)
          fail('Expected BadRequestException to be thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).name).toBe('BadRequestException')
        }
      })

      it('should include BadRequestException type in authorization error', async () => {
        // Arrange
        const mockUser = createMockUser({
          id: 'user-123',
          nationalId: '1234567890',
        })
        const rejectedAdvert = createMockAdvert({
          statusId: StatusIdEnum.REJECTED,
          assignedUserId: 'different-user',
        })

        userModel.unscoped.mockReturnThis()
        userModel.findOneOrThrow = jest.fn().mockResolvedValue(mockUser)
        advertModel.unscoped.mockReturnThis()
        advertModel.findByPkOrThrow = jest
          .fn()
          .mockResolvedValue(rejectedAdvert)

        const currentUser = createMockDMRUser('1234567890')

        // Act & Assert
        try {
          await service.reactivateAdvert('advert-123', currentUser as any)
          fail('Expected BadRequestException to be thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).name).toBe('BadRequestException')
        }
      })
    })
  })

  describe('getAdverts', () => {
    const mockAdverts = [
      {
        id: 'advert-1',
        title: 'Innköllun þrotabús',
        content: '<p>Þrotabú content</p>',
        createdByNationalId: '1234567890',
        publicationNumber: '123/2024',
        fromModel: jest.fn().mockReturnValue({
          id: 'advert-1',
          title: 'Innköllun þrotabús',
        }),
      },
      {
        id: 'advert-2',
        title: 'Skipti dánarbús',
        content: '<p>Dánarbú content</p>',
        createdByNationalId: '0987654321',
        publicationNumber: '456/2024',
        fromModel: jest.fn().mockReturnValue({
          id: 'advert-2',
          title: 'Skipti dánarbús',
        }),
      },
    ]

    beforeEach(() => {
      advertModel.scope = jest.fn().mockReturnThis()
      advertModel.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockAdverts,
        count: mockAdverts.length,
      })
    })

    describe('search by national ID', () => {
      it('should search by exact national ID when format matches (with dash)', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '123456-7890',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        expect(advertModel.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdByNationalId: '1234567890',
            }),
          }),
        )
      })

      it('should search by exact national ID when format matches (without dash)', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '1234567890',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        expect(advertModel.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdByNationalId: '1234567890',
            }),
          }),
        )
      })

      it('should NOT use national ID search for partial numbers', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '12345', // Only 5 digits
        }

        // Act
        await service.getAdverts(query as any)

        // Assert - Should use text search instead
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where).not.toHaveProperty('createdByNationalId')
      })
    })

    describe('search by publication number', () => {
      it('should search by exact publication number when format matches', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '123/2024',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        expect(advertModel.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              publicationNumber: '123/2024',
            }),
          }),
        )
      })

      it('should NOT use publication number search for invalid format', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '123/24', // Invalid year format
        }

        // Act
        await service.getAdverts(query as any)

        // Assert - Should use text search instead
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where).not.toHaveProperty('publicationNumber')
      })
    })

    describe('text search', () => {
      it('should search across multiple fields for single word', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'þrotabú',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const whereConditions = callArgs.where

        // Should have Op.and with one condition
        expect(whereConditions[Op.and]).toBeDefined()
        const andConditions = whereConditions[Op.and]
        expect(andConditions).toHaveLength(1)

        // The condition should have Op.or for multiple fields
        const orCondition = andConditions[0]
        expect(orCondition[Op.or]).toBeDefined()
        const orFields = orCondition[Op.or]

        // Should search in 5 fields
        expect(orFields).toHaveLength(5)
      })

      it('should use AND logic for multi-word search', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'Jón Jónsson þrotabú',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const whereConditions = callArgs.where

        // Should have Op.and with 3 conditions (one per word)
        expect(whereConditions[Op.and]).toBeDefined()
        const andConditions = whereConditions[Op.and]
        expect(andConditions).toHaveLength(3)

        // Each word should have its own OR conditions across fields
        andConditions.forEach((condition: any) => {
          expect(condition[Op.or]).toBeDefined()
          expect(condition[Op.or]).toHaveLength(5)
        })
      })

      it('should filter out empty strings from multi-word search', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '  Jón   Jónsson  ', // Extra spaces
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const whereConditions = callArgs.where

        // Should have 2 conditions (ignoring empty strings from spaces)
        expect(whereConditions[Op.and]).toBeDefined()
        const andConditions = whereConditions[Op.and]
        expect(andConditions).toHaveLength(2)
      })

      it('should search in title field', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orCondition = callArgs.where[Op.and][0][Op.or]

        expect(
          orCondition.some((field: any) =>
            Object.prototype.hasOwnProperty.call(field, 'title'),
          ),
        ).toBe(true)
      })

      it('should search in content field', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orCondition = callArgs.where[Op.and][0][Op.or]

        expect(
          orCondition.some((field: any) =>
            Object.prototype.hasOwnProperty.call(field, 'content'),
          ),
        ).toBe(true)
      })

      it('should search in caption field', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orCondition = callArgs.where[Op.and][0][Op.or]

        expect(
          orCondition.some((field: any) =>
            Object.prototype.hasOwnProperty.call(field, 'caption'),
          ),
        ).toBe(true)
      })

      it('should search in additionalText field', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orCondition = callArgs.where[Op.and][0][Op.or]

        expect(
          orCondition.some((field: any) =>
            Object.prototype.hasOwnProperty.call(field, 'additionalText'),
          ),
        ).toBe(true)
      })

      it('should search in createdBy field', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orCondition = callArgs.where[Op.and][0][Op.or]

        expect(
          orCondition.some((field: any) =>
            Object.prototype.hasOwnProperty.call(field, 'createdBy'),
          ),
        ).toBe(true)
      })
    })

    describe('combined filters with search', () => {
      it('should combine search with typeId filter', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'þrotabú',
          typeId: ['type-1', 'type-2'],
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where).toHaveProperty('typeId')
        expect(callArgs.where[Op.and]).toBeDefined()
      })

      it('should combine search with statusId filter', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '1234567890',
          statusId: [StatusIdEnum.PUBLISHED],
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where).toHaveProperty('statusId')
        expect(callArgs.where).toHaveProperty('createdByNationalId')
      })

      it('should combine search with date filters', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '123/2024',
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31'),
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where).toHaveProperty('createdAt')
        expect(callArgs.where).toHaveProperty('publicationNumber')
      })
    })

    describe('no search term', () => {
      it('should not add search conditions when search is empty', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: '',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where[Op.and]).toBeUndefined()
        expect(callArgs.where).not.toHaveProperty('createdByNationalId')
        expect(callArgs.where).not.toHaveProperty('publicationNumber')
      })

      it('should not add search conditions when search is undefined', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.where[Op.and]).toBeUndefined()
        expect(callArgs.where).not.toHaveProperty('createdByNationalId')
        expect(callArgs.where).not.toHaveProperty('publicationNumber')
      })
    })

    describe('pagination and results', () => {
      it('should return paginated results with correct structure', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          search: 'þrotabú',
        }

        // Act
        const result = await service.getAdverts(query as any)

        // Assert
        expect(result).toHaveProperty('adverts')
        expect(result).toHaveProperty('paging')
        expect(result.adverts).toHaveLength(2)
        expect(result.paging).toHaveProperty('page', 1)
        expect(result.paging).toHaveProperty('pageSize', 10)
      })

      it('should apply limit and offset correctly', async () => {
        // Arrange
        const query = {
          page: 2,
          pageSize: 5,
          search: 'test',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        expect(advertModel.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 5,
            offset: 5,
          }),
        )
      })
    })

    describe('sorting', () => {
      it('should sort by createdAt when sortBy is not specified', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.order).toEqual([['createdAt', 'desc']])
      })

      it('should sort by createdAt when sortBy is explicitly set to createdAt', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          direction: 'asc',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        expect(callArgs.order).toEqual([['createdAt', 'asc']])
      })

      it('should use SQL subquery for birting sort to prioritize next scheduled publication', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          sortBy: 'birting',
          direction: 'asc',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orderClause = callArgs.order[0]

        // Should use literal SQL with COALESCE for smart date selection
        expect(orderClause[0]).toHaveProperty('val')
        expect(orderClause[0].val).toContain('COALESCE')
        expect(orderClause[0].val).toContain('MIN(CASE WHEN')
        expect(orderClause[0].val).toContain('"published_at" IS NULL')
        expect(orderClause[0].val).toContain('MAX')
        expect(orderClause[1]).toBe('asc')
      })

      it('should use descending order by default for birting sort', async () => {
        // Arrange
        const query = {
          page: 1,
          pageSize: 10,
          sortBy: 'birting',
        }

        // Act
        await service.getAdverts(query as any)

        // Assert
        const callArgs = (advertModel.findAndCountAll as jest.Mock).mock
          .calls[0][0]
        const orderClause = callArgs.order[0]

        expect(orderClause[1]).toBe('desc')
      })
    })
  })
})
