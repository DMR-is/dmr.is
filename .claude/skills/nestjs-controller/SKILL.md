---
name: nestjs-controller
description: Create NestJS controllers with services, DTOs, validation, tests, and documentation following DMR.is conventions. Use when creating new API endpoints or CRUD operations.
---

# Create NestJS Controller

Create a new NestJS controller with proper service, DTOs, validation, tests, and documentation following DMR.is conventions.

## When to Use

- Creating a new API resource/module
- Adding CRUD operations for a new entity
- Scaffolding a complete feature endpoint
- Setting up admin or public-facing API routes

## Prerequisites

- [ ] Database model exists (if needed)
- [ ] Migration has been run (if new table)
- [ ] Module structure decision made (standalone vs part of existing module)
- [ ] Authorization requirements determined (admin, scopes, public)

## Implementation Steps

### 1. Plan the Module Structure

Determine the file structure based on the API:

**Legal Gazette API** (`apps/legal-gazette-api/src/modules/{resource}/`):
```
modules/{resource}/
├── dto/
│   ├── create-{resource}.dto.ts
│   ├── update-{resource}.dto.ts
│   ├── get-{resource}-query.dto.ts
│   └── {resource}-response.dto.ts
├── models/
│   └── {resource}.model.ts (if new model)
├── {resource}.controller.ts
├── {resource}.controller.module.ts
├── {resource}.controller.spec.ts
├── {resource}.provider.module.ts
├── {resource}.service.ts
├── {resource}.service.interface.ts
└── {resource}.service.spec.ts
```

**Official Journal API** (`apps/official-journal-api/src/modules/{resource}/`):
- Similar structure, may have additional files for versioning

### 2. Create Service Interface

```typescript
// {resource}.service.interface.ts
import { CreateResourceDto, UpdateResourceDto, ResourceResponseDto } from './dto'

export const IResourceService = Symbol('IResourceService')

export interface IResourceService {
  create(dto: CreateResourceDto): Promise<ResourceResponseDto>
  findAll(query: GetResourceQueryDto): Promise<ResourceResponseDto[]>
  findById(id: string): Promise<ResourceResponseDto | null>
  update(id: string, dto: UpdateResourceDto): Promise<ResourceResponseDto>
  delete(id: string): Promise<void>
}
```

### 3. Create DTOs

See [dto-examples.md](dto-examples.md) for complete DTO patterns including:
- Request DTOs with validation
- Response DTOs with Swagger docs
- Query DTOs with pagination
- Common patterns (enums, dates, filtering)

### 4. Implement Service

See [service-examples.md](service-examples.md) for:
- Complete service implementation
- Logging patterns
- Error handling
- Data mapping methods

### 5. Create Controller

See [controller-examples.md](controller-examples.md) for:
- Basic CRUD controller
- Authorization patterns (Legal Gazette)
- Swagger documentation
- HTTP status codes

### 6. Create NestJS Modules

**Provider Module** (`{resource}.provider.module.ts`):
```typescript
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ResourceModel } from './models/{resource}.model'
import { ResourceService } from './{resource}.service'
import { IResourceService } from './{resource}.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ResourceModel])],
  providers: [
    {
      provide: IResourceService,
      useClass: ResourceService,
    },
  ],
  exports: [IResourceService],
})
export class ResourceProviderModule {}
```

**Controller Module** (`{resource}.controller.module.ts`):
```typescript
import { Module } from '@nestjs/common'

import { ResourceProviderModule } from './{resource}.provider.module'
import { ResourceController } from './{resource}.controller'

@Module({
  imports: [ResourceProviderModule],
  controllers: [ResourceController],
})
export class ResourceControllerModule {}
```

### 7. Register Module in Main App Module

```typescript
// In apps/{api}/src/app/app.module.ts
import { ResourceControllerModule } from './modules/{resource}/{resource}.controller.module'

@Module({
  imports: [
    // ... other modules
    ResourceControllerModule,
  ],
})
export class AppModule {}
```

### 8. Create Tests

See [testing-examples.md](testing-examples.md) for:
- Service tests with mocked models
- Controller tests with mocked services
- Authorization guard tests (Legal Gazette)
- Test user factories

## Authorization Patterns (Legal Gazette)

See [authorization-guide.md](authorization-guide.md) for complete authorization documentation including:
- Authorization matrix (when database lookups happen)
- Available scope decorators
- Controller patterns (admin-only, scope-only, mixed)
- Testing authorization with real Reflector

**Quick Reference:**

| Decorators | User Lookup? | Access Logic |
|------------|--------------|--------------|
| None | ❌ No | Allow (auth only) |
| `@Scopes()` only | ❌ No | Check scope in JWT |
| `@AdminAccess()` only | ✅ Yes | Check user in UserModel |
| `@AdminAccess()` + `@Scopes()` | ✅ Yes | Admin OR scope (OR logic) |

## Swagger Configuration

Legal Gazette API has multiple Swagger UIs for different audiences:
- `/swagger` - Internal API (all endpoints)
- `/public-swagger` - Public web API
- `/application-web-swagger` - Application submissions
- `/island-is-swagger` - Island.is integration

Check `apps/legal-gazette-api/src/swagger.config.ts` for configuration.

## Error Handling

```typescript
// Always throw appropriate HTTP exceptions
throw new NotFoundException(`Resource with id ${id} not found`)
throw new BadRequestException('Invalid input data')
throw new ForbiddenException('You do not have permission')
throw new UnauthorizedException('Authentication required')
```

## Validation Rules

- Use `class-validator` decorators on all DTOs
- Always use `@IsNotEmpty()` for required fields
- Use `@MaxLength()` for string fields
- Use `@IsUUID()` for ID references
- Use `@Type(() => Number)` for numeric query params
- Use `@Type(() => Date)` for date query params

## Checklist

### Planning
- [ ] Database model exists or created
- [ ] Migration run successfully
- [ ] Authorization requirements determined
- [ ] Module structure decided

### Implementation
- [ ] Created service interface (`{resource}.service.interface.ts`)
- [ ] Created DTOs with validation and Swagger decorators:
  - [ ] `create-{resource}.dto.ts`
  - [ ] `update-{resource}.dto.ts` (optional)
  - [ ] `get-{resource}-query.dto.ts` (optional)
  - [ ] `{resource}-response.dto.ts`
- [ ] Implemented service (`{resource}.service.ts`)
- [ ] Implemented controller (`{resource}.controller.ts`)
- [ ] Created provider module (`{resource}.provider.module.ts`)
- [ ] Created controller module (`{resource}.controller.module.ts`)
- [ ] Registered in main app module

### Testing
- [ ] Created service tests (`{resource}.service.spec.ts`)
- [ ] Created controller tests (`{resource}.controller.spec.ts`)
- [ ] Created authorization tests (if using guards)
- [ ] All tests passing: `yarn nx test {api} --testFile=path/to/test.spec.ts`

### Documentation
- [ ] All endpoints have `@ApiOperation()`
- [ ] All endpoints have `@ApiResponse()` for status codes
- [ ] All DTOs have `@ApiProperty()` decorators
- [ ] Path parameters have `@ApiParam()`
- [ ] Controller has `@ApiTags()`

### Validation
- [ ] Ran `yarn nx lint {api}` and fixed issues
- [ ] Ran `yarn nx tsc {api}` and fixed type errors
- [ ] Tested endpoints manually or with integration tests
- [ ] Verified Swagger documentation at `/swagger`

## Important Notes

- Always use `@dmr.is/logging` for NestJS services (Node.js runtime)
- Never use `console.log` - always use the logger
- Use dependency injection with interface symbols
- Follow two-module pattern (provider + controller)
- Include `@LogMethod()` on all controller methods
- Use proper HTTP status codes and decorators
- Always validate input with DTOs
- Write tests for both success and error cases

## Reference Files

- [dto-examples.md](dto-examples.md) - Complete DTO patterns and examples
- [service-examples.md](service-examples.md) - Service implementation patterns
- [controller-examples.md](controller-examples.md) - Controller patterns and examples
- [authorization-guide.md](authorization-guide.md) - Legal Gazette authorization patterns
- [testing-examples.md](testing-examples.md) - Test patterns and examples
