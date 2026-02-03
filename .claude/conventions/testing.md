# Testing Conventions

This guide covers testing patterns and best practices for the DMR.is monorepo.

## Running Tests

### Nx Test Commands

```bash
# Run all tests for a project
yarn nx test <project>

# Run a specific test file (RECOMMENDED - faster)
yarn nx test <project> --testFile=<path/to/file.spec.ts>

# Run tests matching a pattern (slower - runs all tests first, then filters)
yarn nx test <project> --testPathPattern="<pattern>"

# Run tests with coverage
yarn nx test <project> --coverage

# Run tests in watch mode
yarn nx test <project> --watch
```

### Performance Tip

**Always use `--testFile` when running specific tests** instead of `--testPathPattern`:

```bash
# ✅ Fast - Runs only the specified file
yarn nx test legal-gazette-api --testFile=apps/legal-gazette-api/src/modules/advert/advert.service.spec.ts

# ❌ Slow - Runs all tests, then filters
yarn nx test legal-gazette-api --testPathPattern="advert.service"
```

### Running Multiple Projects

```bash
# Run tests for multiple projects
yarn nx run-many --target=test --projects=legal-gazette-api,legal-gazette-web

# Run tests for all projects
yarn nx run-many --target=test --all
```

## Test File Structure

### NestJS Service Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/sequelize'
import { AdvertService } from './advert.service'
import { AdvertModel } from './advert.model'

describe('AdvertService', () => {
  let service: AdvertService
  let model: typeof AdvertModel

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertService,
        {
          provide: getModelToken(AdvertModel),
          useValue: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AdvertService>(AdvertService)
    model = module.get<typeof AdvertModel>(getModelToken(AdvertModel))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findAll', () => {
    it('should return an array of adverts', async () => {
      const mockAdverts = [{ id: '1', title: 'Test' }]
      jest.spyOn(model, 'findAll').mockResolvedValue(mockAdverts as any)

      const result = await service.findAll()

      expect(result).toEqual(mockAdverts)
      expect(model.findAll).toHaveBeenCalledTimes(1)
    })
  })
})
```

### NestJS Controller Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { AdvertController } from './advert.controller'
import { AdvertService } from './advert.service'

describe('AdvertController', () => {
  let controller: AdvertController
  let service: AdvertService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertController],
      providers: [
        {
          provide: AdvertService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AdvertController>(AdvertController)
    service = module.get<AdvertService>(AdvertService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should return array of adverts', async () => {
      const mockAdverts = [{ id: '1' }]
      jest.spyOn(service, 'findAll').mockResolvedValue(mockAdverts as any)

      const result = await controller.findAll()

      expect(result).toEqual(mockAdverts)
    })
  })
})
```

## Mocking Patterns

### Mock Sequelize Models

```typescript
const mockAdvertModel = {
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}

{
  provide: getModelToken(AdvertModel),
  useValue: mockAdvertModel,
}
```

### Mock NestJS Services

```typescript
const mockAdvertService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

{
  provide: AdvertService,
  useValue: mockAdvertService,
}
```

### Mock External Dependencies

```typescript
// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}))

// Mock external API client
jest.mock('@dmr.is/api-client', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}))
```

## Coverage Requirements

### Running with Coverage

```bash
# Generate coverage report
yarn nx test <project> --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.ts`:

```typescript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## Common Testing Utilities

### Test Data Builders

```typescript
// test/builders/advert.builder.ts
export class AdvertBuilder {
  private advert: Partial<AdvertModel> = {
    id: '1',
    title: 'Test Advert',
    status: 'DRAFT',
  }

  withId(id: string): this {
    this.advert.id = id
    return this
  }

  withTitle(title: string): this {
    this.advert.title = title
    return this
  }

  withStatus(status: string): this {
    this.advert.status = status
    return this
  }

  build(): AdvertModel {
    return this.advert as AdvertModel
  }
}

// Usage in tests
const advert = new AdvertBuilder()
  .withId('123')
  .withStatus('PUBLISHED')
  .build()
```

### Test Helpers

```typescript
// test/helpers/setup.ts
export const setupTestModule = async (providers: Provider[]) => {
  const module = await Test.createTestingModule({
    providers,
  }).compile()

  return module
}

// test/helpers/mock-data.ts
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
}

export const mockAdvert = {
  id: '1',
  title: 'Test Advert',
  status: 'DRAFT',
}
```

## Next.js Component Testing

### React Testing Library

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvertCard } from './AdvertCard'

describe('AdvertCard', () => {
  it('renders advert title', () => {
    render(<AdvertCard title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()

    render(<AdvertCard title="Test" onClick={onClick} />)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

## Common Pitfalls

### ❌ Forgetting to Mock Dependencies

```typescript
// Wrong - Service will try to connect to real database
const module = await Test.createTestingModule({
  providers: [AdvertService],
}).compile()

// Correct - Mock the model dependency
const module = await Test.createTestingModule({
  providers: [
    AdvertService,
    {
      provide: getModelToken(AdvertModel),
      useValue: mockAdvertModel,
    },
  ],
}).compile()
```

### ❌ Not Cleaning Up After Tests

```typescript
// Add cleanup
afterEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await module.close()
})
```

### ❌ Testing Implementation Details

```typescript
// ❌ Wrong - Testing internal state
expect(service['internalCache']).toEqual(...)

// ✅ Correct - Testing public behavior
expect(service.getFromCache()).toEqual(...)
```

### ❌ Not Handling Async Properly

```typescript
// ❌ Wrong - Missing await
it('should create advert', () => {
  service.create(dto)
  expect(model.create).toHaveBeenCalled()
})

// ✅ Correct - Properly awaited
it('should create advert', async () => {
  await service.create(dto)
  expect(model.create).toHaveBeenCalled()
})
```

## Best Practices

1. **Use descriptive test names**: `it('should return 404 when advert not found')`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **One assertion per test** (when possible)
4. **Mock external dependencies**: Don't call real APIs or databases
5. **Test edge cases**: Empty arrays, null values, errors
6. **Use test builders**: For complex test data
7. **Keep tests fast**: Mock everything external
8. **Test behavior, not implementation**: Focus on what the code does, not how

## Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with verbose output
yarn nx test <project> --testFile=<file> --verbose

# Run tests without cache
yarn nx test <project> --no-cache
```

---

**Related Documentation**:
- [Unit Tests Skill](../skills/unit-tests/skill.md) - Auto-generate tests
- [NestJS Conventions](./nestjs.md) - Service/controller patterns
- [Legal Gazette Apps](../apps/legal-gazette/CLAUDE.md)
- [Official Journal Apps](../apps/official-journal/CLAUDE.md)
