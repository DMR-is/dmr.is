# Controller Implementation Examples

Complete controller patterns and examples following DMR.is conventions.

## Basic CRUD Controller

```typescript
// {resource}.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { LogMethod } from '@dmr.is/decorators'

import { IResourceService } from './{resource}.service.interface'
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceResponseDto,
  GetResourceQueryDto,
} from './dto'

@Controller({
  path: 'resources',
  version: '1',
})
@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class ResourceController {
  constructor(
    @Inject(IResourceService)
    private readonly resourceService: IResourceService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resource created successfully',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @LogMethod()
  async create(
    @Body() dto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all resources with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resources retrieved successfully',
    type: [ResourceResponseDto],
  })
  @LogMethod()
  async findAll(
    @Query() query: GetResourceQueryDto,
  ): Promise<ResourceResponseDto[]> {
    return this.resourceService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({
    name: 'id',
    description: 'Resource UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource found',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
  })
  @LogMethod()
  async findById(@Param('id') id: string): Promise<ResourceResponseDto> {
    const resource = await this.resourceService.findById(id)

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`)
    }

    return resource
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
  })
  @LogMethod()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Resource deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
  })
  @LogMethod()
  async delete(@Param('id') id: string): Promise<void> {
    return this.resourceService.delete(id)
  }
}
```

## Legal Gazette Authorization Patterns

### Admin-Only Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { AdminAccess } from '../../../core/decorators/admin.decorator'

@Controller({
  path: 'admin/resources',
  version: '1',
})
@ApiTags('Admin - Resources')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess() // Requires user in UserModel table
export class AdminResourceController {
  // All methods require admin access (database lookup)

  @Get()
  @ApiOperation({ summary: 'Admin: Get all resources' })
  @LogMethod()
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourceService.findAll()
  }
}
```

### Scope-Only Controller (No Database Lookup)

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { PublicWebScopes } from '@dmr.is/modules/guards/auth'

@Controller({
  path: 'public/resources',
  version: '1',
})
@ApiTags('Public - Resources')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicWebScopes() // Requires '@logbirtingablad.is/logbirtingabladid' scope
export class PublicResourceController {
  // All methods check JWT scope only (no database lookup)

  @Get()
  @ApiOperation({ summary: 'Public: Get all resources' })
  @LogMethod()
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourceService.findAll()
  }
}
```

### Mixed Access Controller (Admin OR Scope)

```typescript
import { Controller, UseGuards, Get, Post } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { ApplicationWebScopes } from '@dmr.is/modules/guards/auth'
import { AdminAccess } from '../../../core/decorators/admin.decorator'

@Controller({
  path: 'resources',
  version: '1',
})
@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@ApplicationWebScopes() // Class-level scope
@AdminAccess() // Class-level admin access
export class ResourceController {
  // Admin users OR users with '@logbirtingablad.is/lg-application-web' scope

  @Get()
  @ApiOperation({ summary: 'Get all resources (admin or application-web)' })
  @LogMethod()
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourceService.findAll()
  }

  // Method-level decorator overrides class-level
  @Post()
  @PublicWebScopes() // Overrides class-level scopes
  @ApiOperation({ summary: 'Create resource (admin or public-web)' })
  @LogMethod()
  async create(
    @Body() dto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.create(dto)
  }
}
```

### Multiple Scope Options

```typescript
import { PublicOrApplicationWebScopes } from '@dmr.is/modules/guards/auth'

@Controller({
  path: 'shared/resources',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicOrApplicationWebScopes() // Either public or application scope
export class SharedResourceController {
  // Users with either scope can access
}
```

## Controller with Pagination

```typescript
import { PaginatedResponseDto } from './dto/paginated-response.dto'

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Get()
  @ApiOperation({ summary: 'Get paginated resources' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedResponseDto,
  })
  @LogMethod()
  async findAllPaginated(
    @Query() query: GetResourceQueryDto,
  ): Promise<PaginatedResponseDto<ResourceResponseDto>> {
    return this.resourceService.findAllPaginated(query)
  }
}
```

## Controller with File Upload

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiBody } from '@nestjs/swagger'

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload file for resource' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @LogMethod()
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    return this.resourceService.uploadFile(file)
  }
}
```

## Controller with Custom Decorators

```typescript
import { CurrentUser } from '@dmr.is/decorators'

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Get('my-resources')
  @ApiOperation({ summary: 'Get resources for current user' })
  @LogMethod()
  async getMyResources(
    @CurrentUser() user: { nationalId: string },
  ): Promise<ResourceResponseDto[]> {
    return this.resourceService.findByUser(user.nationalId)
  }
}
```

## Controller with Request Validation

```typescript
import { ValidationPipe } from '@nestjs/common'

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create resource with strict validation' })
  @LogMethod()
  async create(
    @Body() dto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.create(dto)
  }
}
```

## Controller with Batch Operations

```typescript
@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple resources' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [ResourceResponseDto],
  })
  @LogMethod()
  async createBatch(
    @Body() dtos: CreateResourceDto[],
  ): Promise<ResourceResponseDto[]> {
    return this.resourceService.createBatch(dtos)
  }

  @Delete('batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple resources' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  @LogMethod()
  async deleteBatch(@Body('ids') ids: string[]): Promise<void> {
    return this.resourceService.deleteBatch(ids)
  }
}
```

## Controller with Nested Routes

```typescript
@Controller({ path: 'parents/:parentId/resources', version: '1' })
export class NestedResourceController {
  @Get()
  @ApiOperation({ summary: 'Get resources for a parent' })
  @ApiParam({ name: 'parentId', description: 'Parent UUID' })
  @LogMethod()
  async findByParent(
    @Param('parentId') parentId: string,
    @Query() query: GetResourceQueryDto,
  ): Promise<ResourceResponseDto[]> {
    return this.resourceService.findByParent(parentId, query)
  }

  @Post()
  @ApiOperation({ summary: 'Create resource under parent' })
  @ApiParam({ name: 'parentId', description: 'Parent UUID' })
  @LogMethod()
  async create(
    @Param('parentId') parentId: string,
    @Body() dto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.create({ ...dto, parentId })
  }
}
```

## Controller with Export Endpoint

```typescript
import { Response } from 'express'

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  @Get('export')
  @ApiOperation({ summary: 'Export resources as CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file download',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @LogMethod()
  async exportCsv(
    @Query() query: GetResourceQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.resourceService.exportToCsv(query)

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=resources.csv',
    })

    res.send(csv)
  }
}
```

## HTTP Status Codes Reference

```typescript
// Success
@HttpCode(HttpStatus.OK)              // 200 - Default for GET, PUT, PATCH
@HttpCode(HttpStatus.CREATED)         // 201 - Use for POST (create)
@HttpCode(HttpStatus.NO_CONTENT)      // 204 - Use for DELETE

// Client Errors
throw new BadRequestException()       // 400 - Invalid input
throw new UnauthorizedException()     // 401 - Not authenticated
throw new ForbiddenException()        // 403 - Not authorized
throw new NotFoundException()         // 404 - Resource not found
throw new ConflictException()         // 409 - Duplicate/conflict

// Server Errors
throw new InternalServerErrorException() // 500 - Unexpected error
```

## Swagger Documentation Best Practices

```typescript
@Controller({ path: 'resources', version: '1' })
@ApiTags('Resources') // Groups endpoints in Swagger UI
@ApiBearerAuth() // Shows lock icon, indicates auth required
export class ResourceController {
  @Post()
  @ApiOperation({
    summary: 'Create a new resource', // Short description (shown in list)
    description: 'Creates a new resource with validation and returns the created entity', // Long description (shown in details)
  })
  @ApiResponse({
    status: 201,
    description: 'Resource created successfully',
    type: ResourceResponseDto, // Shows response schema
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async create(@Body() dto: CreateResourceDto): Promise<ResourceResponseDto> {
    return this.resourceService.create(dto)
  }
}
```

## Important Notes

- Always use `@LogMethod()` decorator on controller methods
- Include `@ApiOperation()` on all endpoints for Swagger docs
- Document all possible status codes with `@ApiResponse()`
- Use proper HTTP status codes with `@HttpCode()`
- Use `@ApiTags()` to group related endpoints
- Use `@ApiBearerAuth()` to indicate auth requirement
- Use `@ApiParam()` for path parameters
- Validate path parameters exist before returning 404
- Never expose internal errors to clients
- Legal Gazette: Use `AuthorizationGuard` with proper decorators
- Method-level decorators override class-level decorators
