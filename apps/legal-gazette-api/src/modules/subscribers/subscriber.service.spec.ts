import { NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../core/constants'
import { SubscriberModel } from '../../models/subscriber.model'
import { PgAdvisoryLockService } from '../advert/tasks/lock.service'
import { SubscriberService } from './subscriber.service'
// ==========================================
// Mock Factories
// ==========================================
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})
const createMockUser = (overrides: Partial<DMRUser> = {}): DMRUser => ({
  nationalId: '0101801234',
  name: 'Test User',
  fullName: 'Test User Full Name',
  scope: [],
  client: 'test-client',
  authorization: 'Bearer test-token',
  ...overrides,
})
interface MockSubscriber {
  id: string
  nationalId: string
  name: string | null
  email: string | null
  isActive: boolean
  subscribedFrom: Date | null
  subscribedTo: Date | null
  fromModel: () => MockSubscriber
}
const createMockSubscriber = (
  overrides: Partial<MockSubscriber> = {},
): MockSubscriber => {
  const subscriber: MockSubscriber = {
    id: 'subscriber-123',
    nationalId: '0101801234',
    name: 'Test User',
    email: 'test@example.com',
    isActive: false,
    subscribedFrom: null,
    subscribedTo: null,
    ...overrides,
    fromModel: jest.fn(),
  }
  subscriber.fromModel = jest.fn().mockReturnValue({
    id: subscriber.id,
    nationalId: subscriber.nationalId,
    name: subscriber.name,
    email: subscriber.email,
    isActive: subscriber.isActive,
    subscribedFrom: subscriber.subscribedFrom,
    subscribedTo: subscriber.subscribedTo,
  })
  return subscriber
}

/**
 * Creates a mock lock service that executes the callback immediately.
 * Can be configured to simulate lock being held by another process.
 */
const createMockLockService = (lockHeld = false) => ({
  runWithUserLock: jest
    .fn()
    .mockImplementation(async <T>(_userKey: string, fn: () => Promise<T>) => {
      if (lockHeld) {
        return { success: false, reason: 'lock_held' }
      }
      const result = await fn()
      return { success: true, result }
    }),
})

// ==========================================
// Test Suite
// ==========================================

describe('SubscriberService', () => {
  let service: SubscriberService
  let subscriberModel: {
    findOne: jest.Mock
    findOrCreate: jest.Mock
    findOneOrThrow: jest.Mock
    update: jest.Mock
  }
  let eventEmitter: jest.Mocked<EventEmitter2>
  let lockService: ReturnType<typeof createMockLockService>
  beforeEach(async () => {
    jest.clearAllMocks()
    const mockSubscriberModel = {
      findOne: jest.fn(),
      findOrCreate: jest.fn(),
      findOneOrThrow: jest.fn(),
      update: jest.fn(),
    }
    const mockEventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue([]),
    }
    lockService = createMockLockService()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriberService,
        {
          provide: LOGGER_PROVIDER,
          useValue: createMockLogger(),
        },
        {
          provide: getModelToken(SubscriberModel),
          useValue: mockSubscriberModel,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: PgAdvisoryLockService,
          useValue: lockService,
        },
      ],
    }).compile()
    service = module.get<SubscriberService>(SubscriberService)
    subscriberModel = module.get(getModelToken(SubscriberModel))
    eventEmitter = module.get(EventEmitter2)
  })
  // ==========================================
  // C-3: Race Condition - Duplicate Payment Prevention
  // ==========================================
  describe('createSubscriptionForUser - Duplicate Prevention (C-3 Critical Issue)', () => {
    describe('when subscription is already active and not expired', () => {
      it('should return success without emitting payment event', async () => {
        // Arrange: Subscriber with active subscription expiring in the future
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        const activeSubscriber = createMockSubscriber({
          isActive: true,
          subscribedFrom: new Date('2025-01-01'),
          subscribedTo: futureDate,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(activeSubscriber)
        const user = createMockUser()
        // Act
        const result = await service.createSubscriptionForUser(user)
        // Assert: Should return success but NOT emit payment event
        expect(result).toEqual({ success: true })
        expect(eventEmitter.emitAsync).not.toHaveBeenCalled()
      })
      it('should log that subscription is already active', async () => {
        // Arrange
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const activeSubscriber = createMockSubscriber({
          isActive: true,
          subscribedTo: futureDate,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(activeSubscriber)
        const logger = {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        }
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            SubscriberService,
            { provide: LOGGER_PROVIDER, useValue: logger },
            {
              provide: getModelToken(SubscriberModel),
              useValue: subscriberModel,
            },
            { provide: EventEmitter2, useValue: eventEmitter },
            {
              provide: PgAdvisoryLockService,
              useValue: createMockLockService(),
            },
          ],
        }).compile()
        const serviceWithLogger =
          module.get<SubscriberService>(SubscriberService)
        // Act
        await serviceWithLogger.createSubscriptionForUser(createMockUser())
        // Assert: Should log that subscription is already active
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining('already active'),
          expect.any(Object),
        )
      })
    })
    describe('when subscription is expired', () => {
      it('should allow renewal and emit payment event', async () => {
        // Arrange: Subscriber with expired subscription
        const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        const expiredSubscriber = createMockSubscriber({
          isActive: true, // Still marked active but expired
          subscribedFrom: new Date('2024-01-01'),
          subscribedTo: pastDate,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(expiredSubscriber)
        const user = createMockUser()
        // Act
        const result = await service.createSubscriptionForUser(user)
        // Assert: Should emit payment event for renewal
        expect(result).toEqual({ success: true })
        expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
          LegalGazetteEvents.SUBSCRIBER_CREATED,
          expect.objectContaining({
            subscriber: expect.any(Object),
            actorNationalId: user.nationalId,
          }),
        )
      })
    })
    describe('when subscriber is inactive', () => {
      it('should emit payment event for new subscription', async () => {
        // Arrange: Inactive subscriber
        const inactiveSubscriber = createMockSubscriber({
          isActive: false,
          subscribedFrom: null,
          subscribedTo: null,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(inactiveSubscriber)
        const user = createMockUser()
        // Act
        const result = await service.createSubscriptionForUser(user)
        // Assert: Should emit payment event
        expect(result).toEqual({ success: true })
        expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
          LegalGazetteEvents.SUBSCRIBER_CREATED,
          expect.objectContaining({
            subscriber: expect.any(Object),
          }),
        )
      })
    })
    describe('when subscriber does not exist', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        subscriberModel.findOneOrThrow.mockRejectedValue(
          new NotFoundException(
            'Subscriber not found when creating subscription',
          ),
        )
        const user = createMockUser()
        // Act & Assert
        await expect(service.createSubscriptionForUser(user)).rejects.toThrow(
          NotFoundException,
        )
        expect(eventEmitter.emitAsync).not.toHaveBeenCalled()
      })
    })
    describe('idempotency for rapid duplicate requests', () => {
      it('should be idempotent when called twice with same user and active subscription', async () => {
        // Arrange: Active subscriber
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const activeSubscriber = createMockSubscriber({
          isActive: true,
          subscribedTo: futureDate,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(activeSubscriber)
        const user = createMockUser()
        // Act: Call twice (simulating double-click)
        const result1 = await service.createSubscriptionForUser(user)
        const result2 = await service.createSubscriptionForUser(user)
        // Assert: Both should succeed, but no payment events emitted
        expect(result1).toEqual({ success: true })
        expect(result2).toEqual({ success: true })
        expect(eventEmitter.emitAsync).not.toHaveBeenCalled()
      })
    })
    describe('edge cases', () => {
      it('should treat subscription expiring today as expired', async () => {
        // Arrange: Subscription expires exactly now
        const now = new Date()
        const subscriber = createMockSubscriber({
          isActive: true,
          subscribedTo: new Date(now.getTime() - 1000), // 1 second ago
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(subscriber)
        const user = createMockUser()
        // Act
        await service.createSubscriptionForUser(user)
        // Assert: Should emit payment event since subscription just expired
        expect(eventEmitter.emitAsync).toHaveBeenCalled()
      })
      it('should handle subscriber with isActive=false but future subscribedTo date', async () => {
        // Arrange: Edge case - marked inactive but has future date (data inconsistency)
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const subscriber = createMockSubscriber({
          isActive: false,
          subscribedTo: futureDate,
        })
        subscriberModel.findOneOrThrow.mockResolvedValue(subscriber)
        const user = createMockUser()
        // Act
        await service.createSubscriptionForUser(user)
        // Assert: Should treat as needing subscription since isActive=false
        expect(eventEmitter.emitAsync).toHaveBeenCalled()
      })
    })
    describe('delegation support', () => {
      it('should use actor nationalId when present (delegation)', async () => {
        // Arrange
        const inactiveSubscriber = createMockSubscriber({ isActive: false })
        subscriberModel.findOneOrThrow.mockResolvedValue(inactiveSubscriber)
        const user = createMockUser({
          nationalId: '0101801234',
          actor: { nationalId: '9999999999', name: 'Actor Name', scope: [] },
        })
        // Act
        await service.createSubscriptionForUser(user)
        // Assert: Should use actor's nationalId
        expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
          LegalGazetteEvents.SUBSCRIBER_CREATED,
          expect.objectContaining({
            actorNationalId: '9999999999',
          }),
        )
      })
    })
    describe('distributed locking', () => {
      it('should acquire lock with user nationalId', async () => {
        // Arrange
        const inactiveSubscriber = createMockSubscriber({ isActive: false })
        subscriberModel.findOneOrThrow.mockResolvedValue(inactiveSubscriber)
        const user = createMockUser({ nationalId: '1234567890' })
        // Act
        await service.createSubscriptionForUser(user)
        // Assert: Lock should be acquired with the user's nationalId
        expect(lockService.runWithUserLock).toHaveBeenCalledWith(
          '1234567890',
          expect.any(Function),
        )
      })
      it('should return success when lock is held by another request', async () => {
        // Arrange: Configure lock service to simulate lock being held
        lockService.runWithUserLock.mockResolvedValue({
          success: false,
          reason: 'lock_held',
        })
        const user = createMockUser()
        // Act
        const result = await service.createSubscriptionForUser(user)
        // Assert: Should return success (idempotent) without emitting event
        expect(result).toEqual({ success: true })
        expect(eventEmitter.emitAsync).not.toHaveBeenCalled()
      })
      it('should not emit payment event when concurrent request is blocked', async () => {
        // Arrange: First call succeeds, second is blocked
        const inactiveSubscriber = createMockSubscriber({ isActive: false })
        // First call - lock acquired, emits event
        lockService.runWithUserLock
          .mockImplementationOnce(async (_key, fn) => {
            subscriberModel.findOneOrThrow.mockResolvedValue(inactiveSubscriber)
            const result = await fn()
            return { success: true, result }
          })
          // Second call - lock held
          .mockResolvedValueOnce({ success: false, reason: 'lock_held' })
        const user = createMockUser()
        // Act
        const result1 = await service.createSubscriptionForUser(user)
        const result2 = await service.createSubscriptionForUser(user)
        // Assert: Both return success, but only one event emitted
        expect(result1).toEqual({ success: true })
        expect(result2).toEqual({ success: true })
        expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1)
      })
    })
  })
})
