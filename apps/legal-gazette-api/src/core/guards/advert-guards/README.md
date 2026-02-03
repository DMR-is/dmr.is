# Advert Guards Module

This module provides authorization guards for advert-related operations in the Legal Gazette API.

## Overview

The `AdvertGuardsModule` centralizes all advert-related authorization logic, making it easy to import and use these guards across different controllers.

## Guards Included

### 1. `CanEditGuard`

- **Purpose**: Validates if a user can edit an advert
- **Logic**: Checks if user is assigned to the advert via `advert.canEdit(adminUserId)`
- **Use case**: Edit operations that require user assignment

### 2. `CanPublishGuard`

- **Purpose**: Validates if an advert can be published
- **Logic**: Checks if advert is in `READY_FOR_PUBLICATION` or `IN_PUBLISHING` status
- **Use case**: Single advert publish operations
- **Note**: Does NOT check user assignment (handled by `@AdminAccess()`)

### 3. `CanPublishBulkGuard`

- **Purpose**: Validates if multiple adverts can be published
- **Logic**: Validates all adverts in `advertIds` array from request body
- **Use case**: Bulk publish operations
- **Returns**: Lists unpublishable advert IDs in error messages

### 4. `CanEditOrPublishGuard` ⭐

- **Purpose**: Validates if user can edit OR advert can be published
- **Logic**: Passes if EITHER condition is met (OR logic)
  - User can edit (assigned to advert), OR
  - Advert can be published (publishable status)
- **Use case**: Operations that should be allowed for both editors and publishers
- **Example**: Creating/updating/deleting publications

## Features

### Nested Resource Support

All guards support nested resource resolution:

- Direct routes: `/adverts/:advertId` or `/adverts/:id`
- Nested routes: `/publications/:publicationId` (resolves `advertId` via lookup)

**Parameter Priority**: `advertId` > `id` > `publicationId`

### Error Handling

- `NotFoundException`: When advert or publication not found
- `ForbiddenException`: When authorization fails
- Detailed logging with context and IDs

## Usage

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common'
import { AdvertGuardsModule } from '../../../core/guards/advert-guards'
import { MyController } from './my.controller'
import { MyProviderModule } from './my.provider.module'

@Module({
  imports: [
    MyProviderModule,
    AdvertGuardsModule, // ✅ Import once
  ],
  controllers: [MyController],
})
export class MyControllerModule {}
```

### 2. Use Guards in Controllers

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { CanEditGuard, CanPublishGuard, CanEditOrPublishGuard } from '../../../core/guards'

@Controller('adverts')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
export class MyController {
  // Edit-only operation (requires assignment)
  @AdminAccess()
  @UseGuards(CanEditGuard)
  @Patch(':advertId')
  async updateAdvert(@Param('advertId') advertId: string) {
    // ...
  }

  // Publish-only operation (status-based)
  @AdminAccess()
  @UseGuards(CanPublishGuard)
  @Post(':advertId/publish')
  async publishAdvert(@Param('advertId') advertId: string) {
    // ...
  }

  // Either edit OR publish (OR logic)
  @AdminAccess()
  @UseGuards(CanEditOrPublishGuard)
  @Post(':advertId/publications')
  async createPublication(@Param('advertId') advertId: string) {
    // Allowed if user is assigned OR advert is publishable
  }

  // Bulk publish
  @AdminAccess()
  @UseGuards(CanPublishBulkGuard)
  @Post('publish-bulk')
  async publishBulk(@Body() body: { advertIds: string[] }) {
    // ...
  }
}
```

### 3. Nested Resource Example

```typescript
@Controller('publications')
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
export class PublicationController {
  @AdminAccess()
  @UseGuards(CanEditOrPublishGuard)
  @Patch(':publicationId') // 👈 Uses publicationId
  async updatePublication(@Param('publicationId') publicationId: string) {
    // Guard automatically resolves advertId from publicationId
  }
}
```

## Guard Combinations

### Common Patterns

1. **Admin-only, edit required**:

   ```typescript
   @AdminAccess()
   @UseGuards(CanEditGuard)
   ```

2. **Admin-only, publish required**:

   ```typescript
   @AdminAccess()
   @UseGuards(CanPublishGuard)
   ```

3. **Admin-only, edit OR publish**:
   ```typescript
   @AdminAccess()
   @UseGuards(CanEditOrPublishGuard)
   ```

### Guard Execution Order

```
1. TokenJwtAuthGuard      - Validates JWT token
2. AuthorizationGuard     - Validates admin access (@AdminAccess)
3. Advert Guard           - Validates advert-specific permissions
   └─ CanEditGuard
   └─ CanPublishGuard
   └─ CanEditOrPublishGuard
   └─ CanPublishBulkGuard
```

## Dependencies

The module automatically provides:

- `SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel])`
- `LoggingModule`

No need to import these separately in your controller module.

## Testing

All guards have comprehensive test suites:

- `can-edit.guard.spec.ts` (19 tests)
- `can-publish.guard.spec.ts` (18 tests)
- `can-publish-bulk.guard.spec.ts` (19 tests)
- `can-edit-or-publish.guard.spec.ts` (16 tests)

Run tests:

```bash
yarn nx test legal-gazette-api --testFile=src/core/guards/advert-guards/can-edit-or-publish.guard.spec.ts
```

## Decision Matrix

| Operation            | User Assignment | Advert Status           | Guard to Use            |
| -------------------- | --------------- | ----------------------- | ----------------------- |
| Edit draft           | ✅ Required     | Any                     | `CanEditGuard`          |
| Publish ready advert | ❌ Not required | READY_FOR_PUBLICATION   | `CanPublishGuard`       |
| Create publication   | ✅ OR Status    | Assigned OR Publishable | `CanEditOrPublishGuard` |
| Update publication   | ✅ OR Status    | Assigned OR Publishable | `CanEditOrPublishGuard` |
| Delete publication   | ✅ OR Status    | Assigned OR Publishable | `CanEditOrPublishGuard` |
| Bulk publish         | ❌ Not required | READY_FOR_PUBLICATION   | `CanPublishBulkGuard`   |

## Architecture Notes

- **Separation of Concerns**: Admin validation (`@AdminAccess`) is separate from business logic validation (guards)
- **Composition**: Guards focus on single responsibility (edit vs publish vs both)
- **Reusability**: Guards work on any route with `advertId`, `id`, or `publicationId` params
- **Type Safety**: Full TypeScript support with proper error types

## Migration Guide

If you have existing controller modules with inline guard providers:

**Before**:

```typescript
@Module({
  imports: [MyProviderModule, SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel])],
  controllers: [MyController],
  providers: [CanEditGuard, CanPublishGuard], // ❌ Manual setup
})
export class MyControllerModule {}
```

**After**:

```typescript
@Module({
  imports: [
    MyProviderModule,
    AdvertGuardsModule, // ✅ One import, all guards available
  ],
  controllers: [MyController],
})
export class MyControllerModule {}
```

## Related Documentation

- [Authorization Guide](../../README.md)
- [NextJS Architecture Guide](../../../../.github/nextjs-architecture-guide.md)
- [Copilot Instructions](../../../../.github/copilot-instructions.md)
