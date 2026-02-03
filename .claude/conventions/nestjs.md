# NestJS Conventions

This guide covers NestJS patterns and best practices used across all DMR.is APIs.

## Two-Module Pattern

**Separation of concerns**: Provider modules handle business logic, controller modules handle HTTP.

### Provider Module (*.provider.module.ts)

Contains service providers, database models, and business logic dependencies.

```typescript
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { CaseService } from './case.service'
import { CaseModel } from './case.model'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseProviderModule {}
```

**Key Points**:
- Import Sequelize models via `SequelizeModule.forFeature()`
- Provide services that implement business logic
- Export services so controller modules can use them
- No controllers in provider modules

### Controller Module (*.controller.module.ts)

Contains controllers and guards, with minimal imports.

```typescript
import { Module } from '@nestjs/common'
import { CaseProviderModule } from './case.provider.module'
import { CaseController } from './case.controller'

@Module({
  imports: [CaseProviderModule],
  controllers: [CaseController],
})
export class CaseControllerModule {}
```

**Key Points**:
- Import only the corresponding provider module
- Register controllers
- No direct service providers (imported via provider module)
- Guards can be added here if needed

### Benefits

1. **Clear separation**: Business logic (providers) vs HTTP layer (controllers)
2. **Reusability**: Provider modules can be imported without controllers
3. **Testing**: Test services independently from HTTP layer
4. **Maintainability**: Changes to HTTP don't affect business logic module

## Sequelize Models

### Model Definition

Use `BaseModel` and `@BaseTable` decorator from `@dmr.is/shared/models/base`:

```typescript
import {
  BaseModel,
  BaseTable,
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
} from '@dmr.is/shared/models/base'
import { LegalGazetteModels } from '@dmr.is/constants'

@BaseTable({ tableName: LegalGazetteModels.Advert })
export class AdvertModel extends BaseModel {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.TEXT,
  })
  description?: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date
}
```

**Key Points**:
- Extend `BaseModel` for common fields (id, createdAt, updatedAt)
- Use `@BaseTable` with table name from constants
- Never use `autoLoadModels` - explicitly import models in modules

### Model Registration

**Always explicitly register models** in provider modules:

```typescript
@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      CategoryModel,
      UserModel,
    ]),
  ],
  providers: [AdvertService],
  exports: [AdvertService],
})
export class AdvertProviderModule {}
```

## Exception Handling

### Validation Pipe

Use `ExceptionFactoryPipe()` for consistent error formatting:

```typescript
import { ValidationPipe } from '@nestjs/common'
import { ExceptionFactoryPipe } from '@dmr.is/pipelines'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: ExceptionFactoryPipe,
      transform: true,
      whitelist: true,
    }),
  )

  await app.listen(3000)
}
```

### Custom Exceptions

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

export class AdvertService {
  async findOne(id: string) {
    const advert = await this.advertModel.findByPk(id)

    if (!advert) {
      throw new NotFoundException(`Advert with ID ${id} not found`)
    }

    return advert
  }

  async create(dto: CreateAdvertDto, user: User) {
    if (!user.canCreateAdverts) {
      throw new UnauthorizedException('User cannot create adverts')
    }

    if (dto.title.length < 3) {
      throw new BadRequestException('Title must be at least 3 characters')
    }

    return this.advertModel.create(dto)
  }
}
```

## API Versioning

Use URI versioning (`/api/v1/`, `/api/v2/`):

```typescript
import { Controller, Get, Version } from '@nestjs/common'

@Controller('adverts')
export class AdvertController {
  // Available at /api/v1/adverts
  @Get()
  @Version('1')
  findAllV1() {
    return this.advertService.findAll()
  }

  // Available at /api/v2/adverts
  @Get()
  @Version('2')
  findAllV2() {
    return this.advertService.findAllWithMetadata()
  }
}
```

**Enable versioning** in main.ts:

```typescript
import { VersioningType } from '@nestjs/common'

app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'api/v',
})
```

## Async Module Init (IMPORTANT)

**Never use `async` on NestJS module lifecycle methods**. This causes silent startup failures.

### ❌ Wrong

```typescript
@Module({})
export class ConfigModule {
  // DO NOT DO THIS - causes startup failure
  static async forRoot() {
    const config = await loadConfig()
    return {
      module: ConfigModule,
      providers: [{ provide: CONFIG, useValue: config }],
    }
  }
}
```

### ✅ Correct

```typescript
@Module({})
export class ConfigModule {
  // Synchronous registration
  static forRoot() {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: CONFIG,
          useFactory: async () => {
            // Async logic goes in useFactory
            return await loadConfig()
          },
        },
      ],
    }
  }
}
```

**Why**: NestJS doesn't await module `forRoot`/`register` methods. Using `async` means the promise is ignored, and the module is registered with `undefined`, causing silent failures.

## Logging

Use `@dmr.is/logging` in NestJS services:

```typescript
import { Injectable } from '@nestjs/common'
import { getLogger } from '@dmr.is/logging'

@Injectable()
export class AdvertService {
  private readonly logger = getLogger(AdvertService.name)

  async create(dto: CreateAdvertDto) {
    this.logger.info('Creating advert', { type: dto.type })

    try {
      const result = await this.advertModel.create(dto)
      this.logger.info('Advert created', { id: result.id })
      return result
    } catch (error) {
      this.logger.error('Failed to create advert', {
        error: error.message,
      })
      throw error
    }
  }
}
```

**See**: [Logging Conventions](./logging.md) for detailed guide

## Caching

Use Redis with `@nestjs/cache-manager`:

```typescript
import { Injectable } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'
import type { Cache } from 'cache-manager'

@Injectable()
export class AdvertService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll() {
    const cacheKey = 'adverts:all'
    const cached = await this.cacheManager.get(cacheKey)

    if (cached) {
      return cached
    }

    const adverts = await this.advertModel.findAll()
    await this.cacheManager.set(cacheKey, adverts, 60000) // 60s TTL

    return adverts
  }
}
```

## Custom Decorators

Common decorators from `@dmr.is/decorators`:

### @LogMethod

Automatically log method entry/exit:

```typescript
import { Injectable } from '@nestjs/common'
import { LogMethod } from '@dmr.is/decorators'

@Injectable()
export class AdvertService {
  @LogMethod()
  async create(dto: CreateAdvertDto) {
    // Automatically logs:
    // "Entering create" with arguments
    // "Exiting create" with result/error
    return this.advertModel.create(dto)
  }
}
```

### @CurrentUser

Extract user from request:

```typescript
import { Controller, Get } from '@nestjs/common'
import { CurrentUser } from '@dmr.is/decorators'
import { User } from '@dmr.is/shared/models'

@Controller('adverts')
export class AdvertController {
  @Get('my')
  findMyAdverts(@CurrentUser() user: User) {
    return this.advertService.findByUser(user.id)
  }
}
```

## Swagger/OpenAPI Documentation

### Decorating DTOs

```typescript
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class CreateAdvertDto {
  @ApiProperty({
    description: 'The title of the advert',
    example: 'Important Notice',
  })
  @IsString()
  title!: string

  @ApiProperty({
    description: 'The description of the advert',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string
}
```

### Decorating Controllers

```typescript
import { Controller, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('adverts')
@Controller('adverts')
export class AdvertController {
  @Post()
  @ApiOperation({ summary: 'Create a new advert' })
  @ApiResponse({
    status: 201,
    description: 'Advert created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  create(@Body() dto: CreateAdvertDto) {
    return this.advertService.create(dto)
  }
}
```

## Testing Patterns

See [Testing Conventions](./testing.md) for comprehensive guide.

### Quick Example

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
            create: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AdvertService>(AdvertService)
    model = module.get<typeof AdvertModel>(getModelToken(AdvertModel))
  })

  it('should create advert', async () => {
    const dto = { title: 'Test' }
    const mockAdvert = { id: '1', ...dto }

    jest.spyOn(model, 'create').mockResolvedValue(mockAdvert as any)

    const result = await service.create(dto)

    expect(result).toEqual(mockAdvert)
    expect(model.create).toHaveBeenCalledWith(dto)
  })
})
```

## Authorization

For Legal Gazette API authorization patterns, see:
- [NestJS Controller Skill](../skills/nestjs-controller/SKILL.md)
- [Authorization Guide](../skills/nestjs-controller/authorization-guide.md)

## Common Patterns

### Service with Transactions

```typescript
import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'

@Injectable()
export class AdvertService {
  constructor(
    @InjectConnection() private sequelize: Sequelize,
  ) {}

  async createWithCategory(dto: CreateAdvertDto) {
    const transaction = await this.sequelize.transaction()

    try {
      const advert = await this.advertModel.create(dto, { transaction })
      const category = await this.categoryModel.create(
        { advertId: advert.id },
        { transaction },
      )

      await transaction.commit()
      return { advert, category }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

### Service with Pagination

```typescript
export class AdvertService {
  async findAll(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit

    const { rows, count } = await this.advertModel.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    }
  }
}
```

## Best Practices

1. **Use Two-Module Pattern**: Separate provider and controller modules
2. **Explicit Model Registration**: Never use `autoLoadModels`
3. **No Async Module Init**: Use `useFactory` for async initialization
4. **Validation**: Use DTOs with class-validator decorators
5. **Exception Handling**: Use NestJS built-in exceptions
6. **Logging**: Use `@dmr.is/logging`, not `console.log`
7. **Testing**: Mock dependencies, test business logic
8. **API Docs**: Document endpoints with Swagger decorators
9. **Versioning**: Use URI versioning for breaking changes
10. **Transactions**: Use for multi-step database operations

---

**Related Documentation**:
- [Testing Conventions](./testing.md)
- [Logging Conventions](./logging.md)
- [NestJS Controller Skill](../skills/nestjs-controller/SKILL.md)
- [Database Migrations Skill](../skills/database-migrations/SKILL.md)
- [Legal Gazette API](../apps/legal-gazette/CLAUDE.md)
- [Official Journal API](../apps/official-journal/CLAUDE.md)
