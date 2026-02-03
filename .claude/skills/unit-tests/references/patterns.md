# Test Patterns

Complete test patterns for each file type in the DMR.is monorepo.

## NestJS Service Tests

Full pattern with dependency injection, model mocking, and transaction simulation.

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { MyService } from './my.service'
import { MyModel } from './models/my.model'
import { IRelatedService } from '../related/related.service.interface'

// Mock factory for test data
const createMockEntity = (overrides: Partial<MockEntity> = {}): MockEntity => {
  const entity: MockEntity = {
    id: overrides.id ?? 'entity-123',
    name: overrides.name ?? 'Test Entity',
    status: overrides.status ?? 'ACTIVE',
    update: jest.fn(),
    destroy: jest.fn(),
    ...overrides,
  }

  // Make update return the updated entity
  entity.update.mockImplementation((updates) => {
    Object.assign(entity, updates)
    return entity
  })

  return entity
}

// Mock logger factory
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})

describe('MyService', () => {
  let service: MyService
  let myModel: jest.Mocked<typeof MyModel>
  let relatedService: jest.Mocked<IRelatedService>
  let sequelize: jest.Mocked<Sequelize>
  let eventEmitter: jest.Mocked<EventEmitter2>

  beforeEach(async () => {
    jest.clearAllMocks()

    // Create mock model
    const mockModel = {
      withScope: jest.fn().mockReturnThis(),
      unscoped: jest.fn().mockReturnThis(),
      findByPk: jest.fn(),
      findByPkOrThrow: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    }

    // Create mock related service
    const mockRelatedService = {
      findById: jest.fn(),
      findAll: jest.fn(),
    }

    // Create mock sequelize with transaction support
    const mockSequelize = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const mockTransaction = {
          commit: jest.fn(),
          rollback: jest.fn(),
          afterCommit: jest.fn((cb) => cb()),
        }
        return callback(mockTransaction)
      }),
    }

    // Create mock event emitter
    const mockEventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: LOGGER_PROVIDER,
          useValue: createMockLogger(),
        },
        {
          provide: getModelToken(MyModel),
          useValue: mockModel,
        },
        {
          provide: IRelatedService,
          useValue: mockRelatedService,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<MyService>(MyService)
    myModel = module.get(getModelToken(MyModel))
    relatedService = module.get(IRelatedService)
    sequelize = module.get(Sequelize)
    eventEmitter = module.get(EventEmitter2)
  })

  describe('findById', () => {
    it('should return entity when found', async () => {
      const mockEntity = createMockEntity()
      myModel.findByPkOrThrow.mockResolvedValue(mockEntity)

      const result = await service.findById('entity-123')

      expect(result).toEqual(mockEntity)
      expect(myModel.findByPkOrThrow).toHaveBeenCalledWith('entity-123')
    })

    it('should throw NotFoundException when entity not found', async () => {
      myModel.findByPkOrThrow.mockRejectedValue(
        new NotFoundException('Entity not found'),
      )

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    it('should update entity successfully', async () => {
      const mockEntity = createMockEntity()
      myModel.findByPkOrThrow.mockResolvedValue(mockEntity)

      const updateDto = { name: 'Updated Name' }
      const result = await service.update('entity-123', updateDto)

      expect(mockEntity.update).toHaveBeenCalledWith(
        updateDto,
        expect.anything(),
      )
      expect(result.name).toBe('Updated Name')
    })

    it('should throw BadRequestException when validation fails', async () => {
      const mockEntity = createMockEntity({ status: 'LOCKED' })
      myModel.findByPkOrThrow.mockResolvedValue(mockEntity)

      const updateDto = { name: 'New Name' }

      await expect(service.update('entity-123', updateDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('create', () => {
    it('should create entity within transaction', async () => {
      const createDto = { name: 'New Entity' }
      const mockCreatedEntity = createMockEntity({ name: 'New Entity' })
      myModel.create.mockResolvedValue(mockCreatedEntity)

      const result = await service.create(createDto)

      expect(sequelize.transaction).toHaveBeenCalled()
      expect(myModel.create).toHaveBeenCalledWith(
        createDto,
        expect.objectContaining({ transaction: expect.anything() }),
      )
      expect(result).toEqual(mockCreatedEntity)
    })

    it('should emit event after successful creation', async () => {
      const createDto = { name: 'New Entity' }
      const mockCreatedEntity = createMockEntity({ name: 'New Entity' })
      myModel.create.mockResolvedValue(mockCreatedEntity)

      await service.create(createDto)

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'entity.created',
        expect.objectContaining({ entity: mockCreatedEntity }),
      )
    })
  })
})
```

## NestJS Controller Tests

Pattern for testing controllers with guards and request handling.

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { MyController } from './my.controller'
import { IMyService } from './my.service.interface'

// Mock service factory
const createMockService = (): jest.Mocked<IMyService> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
})

// Mock logger
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})

describe('MyController', () => {
  let controller: MyController
  let service: jest.Mocked<IMyService>

  beforeEach(async () => {
    jest.clearAllMocks()

    const mockService = createMockService()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        {
          provide: IMyService,
          useValue: mockService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: createMockLogger(),
        },
      ],
    }).compile()

    controller = module.get<MyController>(MyController)
    service = module.get(IMyService)
  })

  describe('getById', () => {
    it('should return entity when found', async () => {
      const mockEntity = { id: 'entity-123', name: 'Test' }
      service.findById.mockResolvedValue(mockEntity)

      const result = await controller.getById('entity-123')

      expect(result).toEqual(mockEntity)
      expect(service.findById).toHaveBeenCalledWith('entity-123')
    })

    it('should throw NotFoundException when entity not found', async () => {
      service.findById.mockRejectedValue(
        new NotFoundException('Entity not found'),
      )

      await expect(controller.getById('invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('create', () => {
    it('should create entity and return result', async () => {
      const createDto = { name: 'New Entity' }
      const mockCreated = { id: 'new-id', ...createDto }
      service.create.mockResolvedValue(mockCreated)

      const result = await controller.create(createDto)

      expect(result).toEqual(mockCreated)
      expect(service.create).toHaveBeenCalledWith(createDto)
    })

    it('should throw BadRequestException on validation error', async () => {
      const createDto = { name: '' }
      service.create.mockRejectedValue(
        new BadRequestException('Name is required'),
      )

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
```

## NestJS Guard Tests

Pattern for testing authorization guards with Reflector.

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'

import { AuthorizationGuard } from './authorization.guard'
import { IUsersService } from '../users/users.service.interface'

// Mock user factory
interface MockUser {
  nationalId: string
  scope?: string[]
}

const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  nationalId: '0101801234',
  scope: [],
  ...overrides,
})

// Mock ExecutionContext factory
const createMockContext = (user: MockUser | null = null): ExecutionContext => {
  const mockRequest = { user }
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext
}

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard
  let reflector: jest.Mocked<Reflector>
  let usersService: jest.Mocked<IUsersService>

  beforeEach(async () => {
    jest.clearAllMocks()

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    }

    const mockUsersService = {
      getUserByNationalId: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: IUsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile()

    guard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get(Reflector)
    usersService = module.get(IUsersService)
  })

  describe('when no decorators present', () => {
    it('should allow access (public endpoint)', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined)
      const context = createMockContext()

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })
  })

  describe('when @AdminAccess() decorator present', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'adminAccess') return true
        return undefined
      })
    })

    it('should allow access when user is admin', async () => {
      const context = createMockContext(createMockUser())
      usersService.getUserByNationalId.mockResolvedValue({ id: 'user-123' })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user is not admin', async () => {
      const context = createMockContext(createMockUser())
      usersService.getUserByNationalId.mockRejectedValue(
        new Error('User not found'),
      )

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('when scope decorator present', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'requiredScopes') return ['@app.is/read']
        return undefined
      })
    })

    it('should allow access when user has required scope', async () => {
      const context = createMockContext(
        createMockUser({ scope: ['@app.is/read'] }),
      )

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user lacks scope', async () => {
      const context = createMockContext(createMockUser({ scope: [] }))

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })
})
```

## Event Listener Tests

Pattern for testing NestJS event listeners.

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { EntityCreatedListener } from './entity-created.listener'
import { EntityCreatedEvent } from './events/entity-created.event'
import { TransactionModel } from './models/transaction.model'
import { IExternalService } from '../external/external.service.interface'

// Event factory
const createMockEvent = (
  overrides: Partial<EntityCreatedEvent> = {},
): EntityCreatedEvent => ({
  entityId: 'entity-123',
  entityName: 'Test Entity',
  actorNationalId: '0101801234',
  ...overrides,
})

// Transaction mock
const createMockTransaction = () => ({
  commit: jest.fn(),
  rollback: jest.fn(),
  afterCommit: jest.fn((cb) => cb()),
})

describe('EntityCreatedListener', () => {
  let listener: EntityCreatedListener
  let transactionModel: jest.Mocked<typeof TransactionModel>
  let externalService: jest.Mocked<IExternalService>
  let sequelize: jest.Mocked<Sequelize>

  beforeEach(async () => {
    jest.clearAllMocks()

    const mockTransactionModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
    }

    const mockExternalService = {
      notifyCreation: jest.fn(),
    }

    const mockSequelize = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(createMockTransaction())
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityCreatedListener,
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getModelToken(TransactionModel),
          useValue: mockTransactionModel,
        },
        {
          provide: IExternalService,
          useValue: mockExternalService,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
      ],
    }).compile()

    listener = module.get<EntityCreatedListener>(EntityCreatedListener)
    transactionModel = module.get(getModelToken(TransactionModel))
    externalService = module.get(IExternalService)
    sequelize = module.get(Sequelize)
  })

  describe('handleEntityCreated', () => {
    it('should create transaction record', async () => {
      const event = createMockEvent()
      const mockRecord = { id: 'tx-123', update: jest.fn() }
      transactionModel.create.mockResolvedValue(mockRecord)

      await listener.handleEntityCreated(event)

      expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: event.entityId,
          status: 'PENDING',
        }),
        expect.anything(),
      )
    })

    it('should notify external service', async () => {
      const event = createMockEvent()
      const mockRecord = { id: 'tx-123', update: jest.fn() }
      transactionModel.create.mockResolvedValue(mockRecord)
      externalService.notifyCreation.mockResolvedValue({ success: true })

      await listener.handleEntityCreated(event)

      expect(externalService.notifyCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: event.entityId,
        }),
      )
    })

    it('should update transaction status to COMPLETED on success', async () => {
      const event = createMockEvent()
      const mockRecord = { id: 'tx-123', update: jest.fn() }
      transactionModel.create.mockResolvedValue(mockRecord)
      externalService.notifyCreation.mockResolvedValue({ success: true })

      await listener.handleEntityCreated(event)

      expect(mockRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'COMPLETED' }),
        expect.anything(),
      )
    })

    it('should update transaction status to FAILED on error', async () => {
      const event = createMockEvent()
      const mockRecord = { id: 'tx-123', update: jest.fn() }
      transactionModel.create.mockResolvedValue(mockRecord)
      externalService.notifyCreation.mockRejectedValue(
        new Error('External service error'),
      )

      await expect(listener.handleEntityCreated(event)).rejects.toThrow(
        'External service error',
      )

      expect(mockRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FAILED' }),
        expect.anything(),
      )
    })
  })
})
```

## Utility Function Tests

Simple, focused tests for utility functions.

```typescript
import { myUtilityFunction } from './my-utility'

describe('myUtilityFunction', () => {
  describe('basic functionality', () => {
    it('should return expected result for valid input', () => {
      const input = 'test input'
      const expected = 'expected output'

      const result = myUtilityFunction(input)

      expect(result).toBe(expected)
    })

    it('should handle multiple inputs', () => {
      const result = myUtilityFunction('input1', 'input2')

      expect(result).toContain('input1')
      expect(result).toContain('input2')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(myUtilityFunction('')).toBe('')
    })

    it('should handle null input', () => {
      expect(myUtilityFunction(null)).toBeNull()
    })

    it('should handle undefined input', () => {
      expect(myUtilityFunction(undefined)).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should throw on invalid input', () => {
      expect(() => myUtilityFunction({ invalid: true })).toThrow(
        'Invalid input type',
      )
    })
  })
})
```

## Async Function Tests with Retry Logic

Pattern for testing async functions with retry and backoff.

```typescript
describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful execution', () => {
    it('should return result immediately on first success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should return result after retries on eventual success', async () => {
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)

      jest.restoreAllMocks()
    })
  })

  describe('exponential backoff', () => {
    it('should use exponential backoff between retries', async () => {
      const delays: number[] = []

      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success')

      await withRetry(mockFn, { baseDelayMs: 1000, maxRetries: 3 })

      // First retry: 1000ms, second retry: 2000ms (exponential)
      expect(delays).toEqual([1000, 2000])

      jest.restoreAllMocks()
    })
  })

  describe('failure after max retries', () => {
    it('should throw last error after max retries exhausted', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'))

      await expect(withRetry(mockFn, { maxRetries: 3 })).rejects.toThrow(
        'Always fails',
      )

      expect(mockFn).toHaveBeenCalledTimes(3)

      jest.restoreAllMocks()
    })
  })
})
```
