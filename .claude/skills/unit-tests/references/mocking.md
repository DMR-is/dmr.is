# Mocking Strategies

Comprehensive mocking patterns used in the DMR.is monorepo.

## Sequelize Model Mocking

### Basic Model Mock

```typescript
import { getModelToken } from '@nestjs/sequelize'
import { MyModel } from './models/my.model'

const mockModel = {
  withScope: jest.fn().mockReturnThis(),
  unscoped: jest.fn().mockReturnThis(),
  findByPk: jest.fn(),
  findByPkOrThrow: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}

// In providers array
{
  provide: getModelToken(MyModel),
  useValue: mockModel,
}
```

### Model Instance Mock with Update

```typescript
const createMockEntity = (overrides = {}) => {
  const entity = {
    id: 'entity-123',
    name: 'Test Entity',
    status: 'ACTIVE',
    update: jest.fn(),
    destroy: jest.fn(),
    save: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  }

  // Make update return the updated entity
  entity.update.mockImplementation((updates) => {
    Object.assign(entity, updates)
    return entity
  })

  // Make save return the entity
  entity.save.mockResolvedValue(entity)

  return entity
}
```

### Scope Chaining

```typescript
const mockModel = {
  withScope: jest.fn().mockReturnThis(),
  unscoped: jest.fn().mockReturnThis(),
  findAll: jest.fn(),
}

// Usage in test
mockModel.withScope.mockReturnThis()
mockModel.findAll.mockResolvedValue([entity1, entity2])

// Assertions
expect(mockModel.withScope).toHaveBeenCalledWith('active')
expect(mockModel.findAll).toHaveBeenCalled()
```

## Transaction Mocking

### Basic Transaction Mock

```typescript
import { Sequelize } from 'sequelize-typescript'

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  afterCommit: jest.fn((cb) => cb()),
}

const mockSequelize = {
  transaction: jest.fn().mockImplementation(async (callback) => {
    return callback(mockTransaction)
  }),
}

// In providers array
{
  provide: Sequelize,
  useValue: mockSequelize,
}
```

### Transaction with Options

```typescript
const mockSequelize = {
  transaction: jest.fn().mockImplementation(async (optionsOrCallback, callback) => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      afterCommit: jest.fn((cb) => cb()),
    }

    // Handle both (callback) and (options, callback) signatures
    const actualCallback = typeof optionsOrCallback === 'function'
      ? optionsOrCallback
      : callback

    return actualCallback(mockTransaction)
  }),
}
```

### Verifying Transaction Usage

```typescript
it('should use transaction for database operations', async () => {
  await service.create(createDto)

  // Verify transaction was called
  expect(sequelize.transaction).toHaveBeenCalled()

  // Verify model operation received transaction
  expect(myModel.create).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ transaction: expect.anything() }),
  )
})
```

## Service Mocking

### Interface-Based Service Mock

```typescript
import { IMyService } from './my.service.interface'

const createMockService = (): jest.Mocked<IMyService> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
})

// In providers array
{
  provide: IMyService,
  useValue: createMockService(),
}
```

### Chained Mock Responses

```typescript
const mockService = {
  findById: jest
    .fn()
    .mockResolvedValueOnce(entity1)  // First call
    .mockResolvedValueOnce(entity2)  // Second call
    .mockRejectedValueOnce(new Error('Not found')),  // Third call
}
```

## Logger Mocking

### Standard Logger Mock

```typescript
import { LOGGER_PROVIDER } from '@dmr.is/logging'

const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
})

// In providers array
{
  provide: LOGGER_PROVIDER,
  useValue: createMockLogger(),
}
```

### Verifying Log Calls

```typescript
it('should log error when operation fails', async () => {
  const logger = module.get(LOGGER_PROVIDER)
  myModel.findByPk.mockRejectedValue(new Error('DB Error'))

  await expect(service.findById('id')).rejects.toThrow()

  expect(logger.error).toHaveBeenCalledWith(
    expect.stringContaining('Failed to find'),
    expect.objectContaining({ error: expect.anything() }),
  )
})
```

## Event Emitter Mocking

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter'

const mockEventEmitter = {
  emit: jest.fn(),
  emitAsync: jest.fn().mockResolvedValue([]),
}

// In providers array
{
  provide: EventEmitter2,
  useValue: mockEventEmitter,
}

// Verification
expect(eventEmitter.emit).toHaveBeenCalledWith(
  'entity.created',
  expect.objectContaining({
    entityId: 'entity-123',
  }),
)
```

## ExecutionContext Mocking (Guards)

```typescript
import { ExecutionContext } from '@nestjs/common'

interface MockUser {
  nationalId: string
  scope?: string[]
}

const createMockContext = (
  user: MockUser | null = null,
  headers: Record<string, string> = {},
): ExecutionContext => {
  const mockRequest = {
    user,
    headers,
    get: (header: string) => headers[header],
  }

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    getType: () => 'http',
  } as unknown as ExecutionContext
}
```

## Reflector Mocking (Decorators)

```typescript
import { Reflector } from '@nestjs/core'

const mockReflector = {
  getAllAndOverride: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
}

// Simulate different decorator combinations
mockReflector.getAllAndOverride.mockImplementation((key) => {
  switch (key) {
    case 'adminAccess':
      return true
    case 'requiredScopes':
      return ['@app.is/read', '@app.is/write']
    default:
      return undefined
  }
})
```

## Environment Variables

### Setup and Teardown

```typescript
const MOCK_ENV = {
  API_URL: 'https://test-api.example.com',
  API_KEY: 'test-key-123',
  FEATURE_FLAG: 'true',
}

beforeAll(() => {
  Object.entries(MOCK_ENV).forEach(([key, value]) => {
    process.env[key] = value
  })
})

afterAll(() => {
  Object.keys(MOCK_ENV).forEach((key) => {
    delete process.env[key]
  })
})
```

### Per-Test Environment

```typescript
describe('with feature flag enabled', () => {
  const originalEnv = process.env.FEATURE_FLAG

  beforeEach(() => {
    process.env.FEATURE_FLAG = 'true'
  })

  afterEach(() => {
    process.env.FEATURE_FLAG = originalEnv
  })

  it('should use new behavior', () => {
    // ...
  })
})
```

## Global Object Mocking

### setTimeout Mocking

```typescript
describe('with timeout', () => {
  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      ;(callback as () => void)()
      return {} as NodeJS.Timeout
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should execute after delay', async () => {
    // setTimeout executes immediately in tests
  })
})
```

### Date Mocking

```typescript
describe('date-dependent tests', () => {
  const mockDate = new Date('2024-01-15T10:00:00Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should use mocked date', () => {
    expect(new Date()).toEqual(mockDate)
  })
})
```

## Module Mocking

### Full Module Mock

```typescript
jest.mock('../../models/status.model', () => ({
  StatusIdEnum: {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    PUBLISHED: 'PUBLISHED',
    REJECTED: 'REJECTED',
  },
}))
```

### Partial Module Mock

```typescript
jest.mock('@dmr.is/utils', () => ({
  ...jest.requireActual('@dmr.is/utils'),
  formatDate: jest.fn().mockReturnValue('2024-01-15'),
}))
```

## Common Assertion Patterns

### Object Matching

```typescript
expect(service.create).toHaveBeenCalledWith(
  expect.objectContaining({
    name: 'Expected Name',
    status: 'ACTIVE',
  }),
)
```

### Array Matching

```typescript
expect(result).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ id: 'entity-1' }),
    expect.objectContaining({ id: 'entity-2' }),
  ]),
)
```

### Function Argument Matching

```typescript
expect(mockFn).toHaveBeenCalledWith(
  'first-arg',
  expect.any(Function),
  expect.anything(),
)
```

### Not Called Verification

```typescript
expect(service.delete).not.toHaveBeenCalled()
```

### Call Order Verification

```typescript
expect(step1).toHaveBeenCalled()
expect(step2).toHaveBeenCalled()

const step1Order = step1.mock.invocationCallOrder[0]
const step2Order = step2.mock.invocationCallOrder[0]
expect(step1Order).toBeLessThan(step2Order)
```
