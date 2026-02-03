# Testing Examples

Complete test patterns for NestJS controllers and services following DMR.is conventions.

## Service Tests

### Basic Service Test

```typescript
// {resource}.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/sequelize'
import { NotFoundException } from '@nestjs/common'

import { ResourceService } from './{resource}.service'
import { ResourceModel } from './models/{resource}.model'
import { CreateResourceDto } from './dto'

describe('ResourceService', () => {
  let service: ResourceService
  let model: typeof ResourceModel

  const mockResourceModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getModelToken(ResourceModel),
          useValue: mockResourceModel,
        },
      ],
    }).compile()

    service = module.get<ResourceService>(ResourceService)
    model = module.get<typeof ResourceModel>(getModelToken(ResourceModel))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a resource successfully', async () => {
      const dto: CreateResourceDto = {
        name: 'Test Resource',
        description: 'Test description',
        parentId: 'parent-uuid',
      }

      const mockCreatedResource = {
        id: 'test-uuid',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceModel.create.mockResolvedValue(mockCreatedResource)

      const result = await service.create(dto)

      expect(mockResourceModel.create).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
      })
      expect(result.id).toBe(mockCreatedResource.id)
      expect(result.name).toBe(dto.name)
    })

    it('should handle errors during creation', async () => {
      const dto: CreateResourceDto = {
        name: 'Test',
        description: 'Test',
        parentId: 'parent-uuid',
      }

      mockResourceModel.create.mockRejectedValue(
        new Error('Database error'),
      )

      await expect(service.create(dto)).rejects.toThrow('Database error')
    })
  })

  describe('findById', () => {
    it('should return resource when found', async () => {
      const mockResource = {
        id: 'test-uuid',
        name: 'Test Resource',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceModel.findByPk.mockResolvedValue(mockResource)

      const result = await service.findById('test-uuid')

      expect(mockResourceModel.findByPk).toHaveBeenCalledWith('test-uuid')
      expect(result).toBeDefined()
      expect(result?.id).toBe(mockResource.id)
    })

    it('should return null when not found', async () => {
      mockResourceModel.findByPk.mockResolvedValue(null)

      const result = await service.findById('non-existent-uuid')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update resource successfully', async () => {
      const updateDto = { name: 'Updated Name' }
      const mockResource = {
        id: 'test-uuid',
        name: 'Original Name',
        update: jest.fn().mockResolvedValue(undefined),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceModel.findByPk.mockResolvedValue(mockResource)

      const result = await service.update('test-uuid', updateDto)

      expect(mockResourceModel.findByPk).toHaveBeenCalledWith('test-uuid')
      expect(mockResource.update).toHaveBeenCalledWith(updateDto)
    })

    it('should throw NotFoundException when resource not found', async () => {
      mockResourceModel.findByPk.mockResolvedValue(null)

      await expect(
        service.update('non-existent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('should delete resource successfully', async () => {
      const mockResource = {
        id: 'test-uuid',
        destroy: jest.fn().mockResolvedValue(undefined),
      }

      mockResourceModel.findByPk.mockResolvedValue(mockResource)

      await service.delete('test-uuid')

      expect(mockResourceModel.findByPk).toHaveBeenCalledWith('test-uuid')
      expect(mockResource.destroy).toHaveBeenCalled()
    })

    it('should throw NotFoundException when resource not found', async () => {
      mockResourceModel.findByPk.mockResolvedValue(null)

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAll', () => {
    it('should return paginated resources', async () => {
      const mockResources = [
        {
          id: '1',
          name: 'Resource 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Resource 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockResourceModel.findAll.mockResolvedValue(mockResources)

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(mockResourceModel.findAll).toHaveBeenCalledWith({
        where: {},
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
      })
      expect(result).toHaveLength(2)
    })

    it('should filter by search term', async () => {
      const mockResources = [
        {
          id: '1',
          name: 'Matching Resource',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockResourceModel.findAll.mockResolvedValue(mockResources)

      await service.findAll({ page: 1, limit: 10, search: 'Matching' })

      expect(mockResourceModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
        }),
      )
    })
  })
})
```

## Controller Tests

### Basic Controller Test

```typescript
// {resource}.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'

import { ResourceController } from './{resource}.controller'
import { IResourceService } from './{resource}.service.interface'
import { CreateResourceDto, ResourceResponseDto } from './dto'

describe('ResourceController', () => {
  let controller: ResourceController
  let service: jest.Mocked<IResourceService>

  const mockResourceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourceController],
      providers: [
        {
          provide: IResourceService,
          useValue: mockResourceService,
        },
      ],
    }).compile()

    controller = module.get<ResourceController>(ResourceController)
    service = module.get(IResourceService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a resource successfully', async () => {
      const dto: CreateResourceDto = {
        name: 'Test Resource',
        description: 'Test description',
        parentId: 'parent-uuid',
      }

      const expectedResponse: ResourceResponseDto = {
        id: 'test-uuid',
        name: dto.name,
        description: dto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceService.create.mockResolvedValue(expectedResponse)

      const result = await controller.create(dto)

      expect(service.create).toHaveBeenCalledWith(dto)
      expect(result).toEqual(expectedResponse)
    })
  })

  describe('findAll', () => {
    it('should return all resources', async () => {
      const query = { page: 1, limit: 10 }
      const expectedResponse: ResourceResponseDto[] = [
        {
          id: '1',
          name: 'Resource 1',
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockResourceService.findAll.mockResolvedValue(expectedResponse)

      const result = await controller.findAll(query)

      expect(service.findAll).toHaveBeenCalledWith(query)
      expect(result).toEqual(expectedResponse)
    })
  })

  describe('findById', () => {
    it('should return resource when found', async () => {
      const expectedResponse: ResourceResponseDto = {
        id: 'test-uuid',
        name: 'Test Resource',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceService.findById.mockResolvedValue(expectedResponse)

      const result = await controller.findById('test-uuid')

      expect(service.findById).toHaveBeenCalledWith('test-uuid')
      expect(result).toEqual(expectedResponse)
    })

    it('should throw NotFoundException when not found', async () => {
      mockResourceService.findById.mockResolvedValue(null)

      await expect(controller.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    it('should update resource successfully', async () => {
      const updateDto = { name: 'Updated Name' }
      const expectedResponse: ResourceResponseDto = {
        id: 'test-uuid',
        name: 'Updated Name',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockResourceService.update.mockResolvedValue(expectedResponse)

      const result = await controller.update('test-uuid', updateDto)

      expect(service.update).toHaveBeenCalledWith('test-uuid', updateDto)
      expect(result).toEqual(expectedResponse)
    })
  })

  describe('delete', () => {
    it('should delete resource successfully', async () => {
      mockResourceService.delete.mockResolvedValue(undefined)

      await controller.delete('test-uuid')

      expect(service.delete).toHaveBeenCalledWith('test-uuid')
    })
  })
})
```

## Authorization Guard Tests (Legal Gazette)

### Complete Authorization Test Suite

```typescript
// {resource}.controller.auth.spec.ts
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { SCOPES_KEY } from '@dmr.is/modules/guards/auth'
import { ADMIN_KEY } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { IUsersService } from '../../users/users.service.interface'
import { ResourceController } from './{resource}.controller'

// Test user constants
const ADMIN_NATIONAL_ID = '1234567890'
const PUBLIC_WEB_NATIONAL_ID = '0987654321'
const APPLICATION_WEB_NATIONAL_ID = '1122334455'

// User factories
interface MockUser {
  nationalId: string
  scope: string
}

const createAdminUser = (): MockUser => ({
  nationalId: ADMIN_NATIONAL_ID,
  scope: '',
})

const createPublicWebUser = (): MockUser => ({
  nationalId: PUBLIC_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/logbirtingabladid',
})

const createApplicationWebUser = (): MockUser => ({
  nationalId: APPLICATION_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/lg-application-web',
})

describe('ResourceController - Guard Authorization', () => {
  let authorizationGuard: AuthorizationGuard
  let reflector: Reflector
  let usersService: jest.Mocked<IUsersService>

  // Create context with REAL controller method reference
  const createMockContext = (
    user: MockUser | null,
    methodName: keyof ResourceController,
  ): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ResourceController.prototype[methodName] as () => void,
    getClass: () => ResourceController,
  } as unknown as ExecutionContext)

  beforeEach(async () => {
    const mockUsersService = {
      getUserByNationalId: jest.fn().mockImplementation((nationalId) => {
        if (nationalId === ADMIN_NATIONAL_ID) {
          return Promise.resolve({
            id: '1',
            nationalId,
            name: 'Admin User',
          })
        }
        throw new Error('User not found')
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        Reflector, // Use REAL Reflector
        {
          provide: IUsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile()

    authorizationGuard = module.get<AuthorizationGuard>(AuthorizationGuard)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get(IUsersService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Decorator verification', () => {
    it('should have @AdminAccess() on class', () => {
      const isAdmin = reflector.getAllAndOverride(ADMIN_KEY, [
        ResourceController,
      ])
      expect(isAdmin).toBe(true)
    })

    it('should have @ApplicationWebScopes() on class', () => {
      const scopes = reflector.getAllAndOverride(SCOPES_KEY, [
        ResourceController,
      ])
      expect(scopes).toContain('@logbirtingablad.is/lg-application-web')
    })

    it('should have method-level scope override on specificMethod', () => {
      const scopes = reflector.getAllAndOverride(SCOPES_KEY, [
        ResourceController.prototype.specificMethod,
        ResourceController,
      ])
      // Verify method-level decorator overrides class-level
      expect(scopes).toEqual(['@logbirtingablad.is/logbirtingabladid'])
    })
  })

  describe('findAll method', () => {
    it('should ALLOW admin users', async () => {
      const context = createMockContext(createAdminUser(), 'findAll')

      const result = await authorizationGuard.canActivate(context)

      expect(result).toBe(true)
      expect(usersService.getUserByNationalId).toHaveBeenCalledWith(
        ADMIN_NATIONAL_ID,
      )
    })

    it('should ALLOW application-web users', async () => {
      const context = createMockContext(
        createApplicationWebUser(),
        'findAll',
      )

      const result = await authorizationGuard.canActivate(context)

      expect(result).toBe(true)
      // Database lookup still happens (due to @AdminAccess on class)
      // but user passes via scope check
    })

    it('should DENY public-web users', async () => {
      const context = createMockContext(createPublicWebUser(), 'findAll')

      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })

    it('should DENY unauthenticated users', async () => {
      const context = createMockContext(null, 'findAll')

      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })

    it('should DENY users without admin or scope', async () => {
      const unauthorizedUser = {
        nationalId: 'unauthorized',
        scope: 'wrong-scope',
      }
      const context = createMockContext(unauthorizedUser, 'findAll')

      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })
  })

  describe('create method (with method-level override)', () => {
    it('should ALLOW admin users', async () => {
      const context = createMockContext(createAdminUser(), 'create')

      const result = await authorizationGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should ALLOW public-web users (method override)', async () => {
      const context = createMockContext(createPublicWebUser(), 'create')

      const result = await authorizationGuard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should DENY application-web users (wrong scope)', async () => {
      const context = createMockContext(
        createApplicationWebUser(),
        'create',
      )

      await expect(authorizationGuard.canActivate(context)).rejects.toThrow()
    })
  })

  describe('Database lookup behavior', () => {
    it('should perform database lookup when @AdminAccess is present', async () => {
      const context = createMockContext(createAdminUser(), 'findAll')

      await authorizationGuard.canActivate(context)

      expect(usersService.getUserByNationalId).toHaveBeenCalledTimes(1)
    })

    it('should not perform database lookup when only scopes present', async () => {
      // Assuming there's a method with only @PublicWebScopes()
      const context = createMockContext(
        createPublicWebUser(),
        'publicOnlyMethod',
      )

      await authorizationGuard.canActivate(context)

      // No database lookup for scope-only check
      expect(usersService.getUserByNationalId).not.toHaveBeenCalled()
    })
  })
})
```

### Test User Factories

```typescript
// test/factories/user.factory.ts
export const TEST_USERS = {
  ADMIN_NATIONAL_ID: '1234567890',
  PUBLIC_WEB_NATIONAL_ID: '0987654321',
  APPLICATION_WEB_NATIONAL_ID: '1122334455',
}

export const createAdminUser = () => ({
  nationalId: TEST_USERS.ADMIN_NATIONAL_ID,
  scope: '',
  name: 'Admin User',
})

export const createPublicWebUser = () => ({
  nationalId: TEST_USERS.PUBLIC_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/logbirtingabladid',
  name: 'Public Web User',
})

export const createApplicationWebUser = () => ({
  nationalId: TEST_USERS.APPLICATION_WEB_NATIONAL_ID,
  scope: '@logbirtingablad.is/lg-application-web',
  name: 'Application Web User',
})
```

## Integration Tests

### Controller Integration Test

```typescript
// {resource}.controller.integration.spec.ts
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'

import { AppModule } from '../../../app/app.module'

describe('ResourceController (Integration)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Get auth token for tests
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' })

    authToken = authResponse.body.token
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/v1/resources', () => {
    it('should create a resource', async () => {
      const dto = {
        name: 'Test Resource',
        description: 'Test',
        parentId: 'parent-uuid',
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dto)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.name).toBe(dto.name)
    })

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        name: '', // Empty name should fail validation
      }

      await request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400)
    })

    it('should return 401 without auth token', async () => {
      const dto = { name: 'Test' }

      await request(app.getHttpServer())
        .post('/api/v1/resources')
        .send(dto)
        .expect(401)
    })
  })

  describe('GET /api/v1/resources/:id', () => {
    it('should return resource when found', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', parentId: 'parent-uuid' })

      const resourceId = createResponse.body.id

      const response = await request(app.getHttpServer())
        .get(`/api/v1/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.id).toBe(resourceId)
    })

    it('should return 404 when not found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/resources/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
```

## Running Tests

```bash
# Run all tests for a project
yarn nx test legal-gazette-api

# Run specific test file (RECOMMENDED - faster)
yarn nx test legal-gazette-api --testFile=src/modules/resource/resource.service.spec.ts

# Run with coverage
yarn nx test legal-gazette-api --coverage

# Run in watch mode
yarn nx test legal-gazette-api --watch

# Run with specific pattern (runs all tests first - slower)
yarn nx test legal-gazette-api --testPathPattern="resource"
```

## Best Practices

1. **Use `--testFile` for specific tests:**
   - Faster than `--testPathPattern`
   - Only runs the specified file

2. **Use real Reflector in authorization tests:**
   - Reads actual decorators from controllers
   - Catches decorator configuration errors

3. **Mock only external dependencies:**
   - Mock database models (`getModelToken`)
   - Mock service interfaces
   - Use real utilities and helpers

4. **Test both success and error cases:**
   - Happy path (successful operations)
   - Error handling (not found, validation errors)
   - Edge cases (null, undefined, empty)

5. **Clear mocks between tests:**
   - Use `afterEach(() => jest.clearAllMocks())`
   - Prevents test pollution

6. **Use descriptive test names:**
   - `should create resource successfully`
   - `should throw NotFoundException when resource not found`
   - `should ALLOW admin users` (for authorization)
   - `should DENY unauthorized users`

7. **Test decorator configuration:**
   - Verify class-level decorators
   - Verify method-level decorators
   - Verify method overrides

8. **Test all user types (authorization):**
   - Admin users
   - Public-web users
   - Application-web users
   - Unauthenticated users
   - Users with wrong scope

## Important Notes

- Always use `jest.clearAllMocks()` in `afterEach()`
- Use `getModelToken()` for Sequelize model mocks
- Use real `Reflector` in authorization tests
- Test both controller and service layers
- Write integration tests for critical paths
- Keep tests maintainable and readable
- Use factories for test data
- Test error cases thoroughly
