import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { UserContext } from '../../../core/context/user/user.context'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'
// The request's CLS transaction the advert lock is taken on
const CLS_TRANSACTION = { id: 'request-transaction' }
jest.mock('cls-hooked', () => {
  const { CLS_NAMESPACE } = jest.requireActual('@dmr.is/constants')
  return {
    getNamespace: (name: string) =>
      name === CLS_NAMESPACE
        ? {
            get: (key: string) =>
              key === 'transaction' ? CLS_TRANSACTION : undefined,
          }
        : undefined,
  }
})
// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
// Mock Sequelize instance
const mockSequelize = {
  transaction: jest.fn(),
}
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
}
let service: IPublicationService
let advertPublicationModel: any
beforeEach(async () => {
  const mockAdvertPublicationModel = {
    count: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    findByPkOrThrow: jest.fn(),
  }
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PublicationService,
      {
        provide: getModelToken(AdvertModel),
        useValue: {
          findOne: jest.fn(),
          findByPkOrThrow: jest.fn(),
          withScope: jest.fn(),
          update: jest.fn(),
        },
      },
      {
        provide: getModelToken(AdvertPublicationModel),
        useValue: mockAdvertPublicationModel,
      },
      {
        provide: CACHE_MANAGER,
        useValue: mockCacheManager,
      },
      {
        provide: Sequelize,
        useValue: mockSequelize,
      },
      {
        provide: LOGGER_PROVIDER,
        useValue: mockLogger,
      },
      {
        provide: EventEmitter2,
        useValue: {
          emit: jest.fn(),
          emitAsync: jest.fn(),
        },
      },
      {
        provide: UserContext,
        useValue: { user: undefined },
      },
    ],
  }).compile()
  service = module.get<IPublicationService>(PublicationService)
  advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))
  jest.clearAllMocks()
})
// Removed publishAdvertPublication tests (method no longer exists)
describe('PublicationService - Delete Publication Protection', () => {
  let service: IPublicationService
  let advertPublicationModel: typeof AdvertPublicationModel
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationService,
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            findOne: jest.fn(),
            findByPkOrThrow: jest.fn(),
            withScope: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
            findByPkOrThrow: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn(),
          },
        },
        {
          provide: UserContext,
          useValue: { user: undefined },
        },
      ],
    }).compile()
    service = module.get<IPublicationService>(PublicationService)
    advertPublicationModel = module.get(getModelToken(AdvertPublicationModel))
    jest.clearAllMocks()
  })
  describe('deleteAdvertPublication', () => {
    it('should throw BadRequestException when trying to delete published version', async () => {
      // Setup: More than one publication exists, but the one to delete is published
      const publishedPublication = {
        id: 'pub-published',
        advertId: 'advert-1',
        publishedAt: new Date('2026-01-08T10:00:00Z'),
        versionNumber: 1,
      }
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockResolvedValue(
        publishedPublication,
      )
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue([
        publishedPublication,
        { id: 'pub-2', publishedAt: null },
      ])
      // Action & Assert
      await expect(service.deletePublication('pub-published')).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.deletePublication('pub-published')).rejects.toThrow(
        'Cannot delete published versions',
      )
      // Assert: destroy should NOT be called
      expect(advertPublicationModel.destroy).not.toHaveBeenCalled()
    })
    it('should allow deletion of unpublished scheduled versions', async () => {
      // Setup: Unpublished version without publishedAt
      const unpublishedPublication = {
        id: 'pub-scheduled',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }
      const remainingPublications = [
        {
          id: 'pub-1',
          versionNumber: 1,
          update: jest.fn().mockResolvedValue(undefined),
        },
      ]
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.findAll as jest.Mock)
        .mockResolvedValueOnce([unpublishedPublication, { id: 'pub-1' }]) // First call for siblings check
        .mockResolvedValueOnce(remainingPublications) // Second call for renumbering
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      // Action
      await service.deletePublication('pub-scheduled')
      // Assert: destroy should be called
      expect(advertPublicationModel.destroy).toHaveBeenCalledWith({
        where: {
          id: 'pub-scheduled',
        },
        force: true,
      })
    })
    it('should throw BadRequestException when trying to delete last publication', async () => {
      // Setup: Only one publication exists
      const onlyPublication = {
        id: 'pub-only',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 1,
      }
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockResolvedValue(
        onlyPublication,
      )
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue([])
      // Action & Assert
      await expect(service.deletePublication('pub-only')).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.deletePublication('pub-only')).rejects.toThrow(
        'At least one publication must remain',
      )
      // Assert: destroy should NOT be called
      expect(advertPublicationModel.destroy).not.toHaveBeenCalled()
    })
    it('should throw NotFoundException when publication does not exist', async () => {
      // Setup: findByPkOrThrow will throw NotFoundException
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockRejectedValue(
        new NotFoundException('Publication not found'),
      )
      // Action & Assert
      await expect(
        service.deletePublication('pub-nonexistent'),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.deletePublication('pub-nonexistent'),
      ).rejects.toThrow('Publication not found')
    })
    it('should properly await version renumbering (M-2 fix)', async () => {
      // Setup: Delete middle publication, verify remaining are renumbered sequentially
      const unpublishedPublication = {
        id: 'pub-2',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }
      const publication1 = {
        id: 'pub-1',
        versionNumber: 1,
        update: jest.fn().mockResolvedValue(undefined),
      }
      const publication3 = {
        id: 'pub-3',
        versionNumber: 3,
        update: jest.fn().mockResolvedValue(undefined),
      }
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.findAll as jest.Mock)
        .mockResolvedValueOnce([
          unpublishedPublication,
          publication1,
          publication3,
        ]) // First call for siblings check
        .mockResolvedValueOnce([publication1, publication3]) // Second call for renumbering
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      // Action
      await service.deletePublication('pub-2')
      // Assert: version numbers should be updated to 1, 2 (not 1, 3)
      expect(publication1.update).toHaveBeenCalledWith({ versionNumber: 1 })
      expect(publication3.update).toHaveBeenCalledWith({ versionNumber: 2 })
      // Assert: Both updates should have completed (if using forEach incorrectly, this might fail)
      expect(publication1.update).toHaveBeenCalledTimes(1)
      expect(publication3.update).toHaveBeenCalledTimes(1)
    })
    it('should call findAll with correct ordering after deletion', async () => {
      // Setup
      const unpublishedPublication = {
        id: 'pub-scheduled',
        advertId: 'advert-1',
        publishedAt: null,
        versionNumber: 2,
      }
      ;(advertPublicationModel.findByPkOrThrow as jest.Mock).mockResolvedValue(
        unpublishedPublication,
      )
      ;(advertPublicationModel.findAll as jest.Mock).mockResolvedValue([
        { ...unpublishedPublication, update: jest.fn() },
        { id: 'pub-1', update: jest.fn() },
      ])
      ;(advertPublicationModel.destroy as jest.Mock).mockResolvedValue(1)
      // Action
      await service.deletePublication('pub-scheduled')
      // Assert: findAll should be called with correct ordering
      expect(advertPublicationModel.findAll).toHaveBeenCalledWith({
        where: { advertId: 'advert-1' },
        order: [
          ['scheduledAt', 'ASC'],
          ['publishedAt', 'ASC'],
        ],
      })
    })
  })
})

describe('PublicationService - updatePublication', () => {
  let service: IPublicationService
  let advertModel: any
  let publicationModel: any

  const scheduled = new Date('2030-01-10T09:00:00.000Z')
  const incoming = new Date('2030-01-20T09:00:00.000Z')

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicationService,
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            unscoped: jest.fn().mockReturnThis(),
            findByPk: jest.fn().mockResolvedValue({ id: 'advert-1' }),
          },
        },
        {
          provide: getModelToken(AdvertPublicationModel),
          useValue: {
            findOneOrThrow: jest.fn(),
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: Sequelize, useValue: mockSequelize },
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: UserContext, useValue: { user: undefined } },
      ],
    }).compile()
    service = module.get<IPublicationService>(PublicationService)
    advertModel = module.get(getModelToken(AdvertModel))
    publicationModel = module.get(getModelToken(AdvertPublicationModel))
  })

  const givenPublication = (publishedAt: Date | null) => {
    const publication = {
      id: 'pub-1',
      advertId: 'advert-1',
      versionNumber: 1,
      scheduledAt: scheduled,
      publishedAt,
      update: jest.fn(),
    }
    publicationModel.findOneOrThrow.mockResolvedValue(publication)
    return publication
  }

  it('locks the advert on the request transaction before the re-read', async () => {
    const publication = givenPublication(null)

    await service.updatePublication('pub-1', { scheduledAt: incoming })

    expect(advertModel.findByPk).toHaveBeenCalledWith('advert-1', {
      attributes: ['id'],
      transaction: CLS_TRANSACTION,
      lock: Transaction.LOCK.NO_KEY_UPDATE,
    })
    // First read finds the advert id, the lock follows, then the re-read
    expect(publicationModel.findOneOrThrow).toHaveBeenCalledTimes(2)
    const [firstRead, reread] =
      publicationModel.findOneOrThrow.mock.invocationCallOrder
    const [lock] = advertModel.findByPk.mock.invocationCallOrder
    expect(firstRead).toBeLessThan(lock)
    expect(lock).toBeLessThan(reread)
    expect(publication.update).toHaveBeenCalledWith({ scheduledAt: incoming })
  })

  it('refuses to reschedule a published publication', async () => {
    const publication = givenPublication(new Date('2030-01-10T09:00:00.000Z'))

    await expect(
      service.updatePublication('pub-1', { scheduledAt: incoming }),
    ).rejects.toThrow(BadRequestException)

    expect(advertModel.findByPk).toHaveBeenCalled()
    expect(publication.update).not.toHaveBeenCalled()
  })
})
