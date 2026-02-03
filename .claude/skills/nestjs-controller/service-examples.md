# Service Implementation Examples

Complete service implementation patterns following DMR.is conventions.

## Basic Service Implementation

```typescript
// {resource}.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { Logger } from '@dmr.is/logging'

import { IResourceService } from './{resource}.service.interface'
import { ResourceModel } from './models/{resource}.model'
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceResponseDto,
  GetResourceQueryDto,
} from './dto'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
  ) {}

  async create(dto: CreateResourceDto): Promise<ResourceResponseDto> {
    this.logger.info('Creating resource', { name: dto.name })

    const resource = await this.resourceModel.create({
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId,
    })

    this.logger.info('Resource created successfully', { id: resource.id })

    return this.mapToDto(resource)
  }

  async findAll(query: GetResourceQueryDto): Promise<ResourceResponseDto[]> {
    this.logger.info('Finding all resources', { query })

    const { page = 1, limit = 10, search } = query
    const offset = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` }
    }

    const resources = await this.resourceModel.findAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    return resources.map((r) => this.mapToDto(r))
  }

  async findById(id: string): Promise<ResourceResponseDto | null> {
    this.logger.info('Finding resource by ID', { id })

    const resource = await this.resourceModel.findByPk(id)

    if (!resource) {
      this.logger.warn('Resource not found', { id })
      return null
    }

    return this.mapToDto(resource)
  }

  async update(
    id: string,
    dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    this.logger.info('Updating resource', { id, dto })

    const resource = await this.resourceModel.findByPk(id)

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`)
    }

    await resource.update(dto)

    this.logger.info('Resource updated successfully', { id })

    return this.mapToDto(resource)
  }

  async delete(id: string): Promise<void> {
    this.logger.info('Deleting resource', { id })

    const resource = await this.resourceModel.findByPk(id)

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`)
    }

    await resource.destroy()

    this.logger.info('Resource deleted successfully', { id })
  }

  private mapToDto(model: ResourceModel): ResourceResponseDto {
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }
  }
}
```

## Service with Relationships

```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Logger } from '@dmr.is/logging'

import { ResourceModel } from './models/{resource}.model'
import { RelatedModel } from '../related/models/related.model'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
    @InjectModel(RelatedModel)
    private readonly relatedModel: typeof RelatedModel,
  ) {}

  async findByIdWithRelations(id: string): Promise<ResourceResponseDto | null> {
    this.logger.info('Finding resource with relations', { id })

    const resource = await this.resourceModel.findByPk(id, {
      include: [
        {
          model: RelatedModel,
          as: 'related',
        },
      ],
    })

    if (!resource) {
      return null
    }

    return this.mapToDtoWithRelations(resource)
  }

  private mapToDtoWithRelations(
    model: ResourceModel,
  ): ResourceResponseDto {
    return {
      id: model.id,
      name: model.name,
      related: model.related?.map((r) => ({
        id: r.id,
        name: r.name,
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }
  }
}
```

## Service with Transactions

```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Logger } from '@dmr.is/logging'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
    @InjectModel(RelatedModel)
    private readonly relatedModel: typeof RelatedModel,
    private readonly sequelize: Sequelize,
  ) {}

  async createWithRelated(
    dto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    this.logger.info('Creating resource with related entities', { dto })

    const transaction = await this.sequelize.transaction()

    try {
      const resource = await this.resourceModel.create(
        {
          name: dto.name,
          description: dto.description,
        },
        { transaction },
      )

      // Create related entities
      await Promise.all(
        dto.relatedItems.map((item) =>
          this.relatedModel.create(
            {
              resourceId: resource.id,
              ...item,
            },
            { transaction },
          ),
        ),
      )

      await transaction.commit()

      this.logger.info('Resource and related entities created', {
        id: resource.id,
      })

      return this.mapToDto(resource)
    } catch (error) {
      await transaction.rollback()
      this.logger.error('Failed to create resource with related entities', {
        error: error.message,
      })
      throw error
    }
  }
}
```

## Service with Pagination Metadata

```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Logger } from '@dmr.is/logging'

import { PaginatedResponseDto } from './dto/paginated-response.dto'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
  ) {}

  async findAllPaginated(
    query: GetResourceQueryDto,
  ): Promise<PaginatedResponseDto<ResourceResponseDto>> {
    this.logger.info('Finding resources with pagination', { query })

    const { page = 1, limit = 10, search } = query
    const offset = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` }
    }

    const { rows, count } = await this.resourceModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    const data = rows.map((r) => this.mapToDto(r))
    const totalPages = Math.ceil(count / limit)

    return {
      data,
      total: count,
      page,
      pageSize: limit,
      totalPages,
    }
  }
}
```

## Service with Complex Filtering

```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { Logger } from '@dmr.is/logging'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
  ) {}

  async findAll(query: GetResourceQueryDto): Promise<ResourceResponseDto[]> {
    this.logger.info('Finding resources with filters', { query })

    const where: any = {}

    // Text search
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ]
    }

    // Status filter
    if (query.status) {
      where.status = query.status
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) {
        where.createdAt[Op.gte] = query.startDate
      }
      if (query.endDate) {
        where.createdAt[Op.lte] = query.endDate
      }
    }

    const resources = await this.resourceModel.findAll({
      where,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      order: [[query.sortBy, query.sortOrder]],
    })

    return resources.map((r) => this.mapToDto(r))
  }
}
```

## Service with Dependent Service Injection

```typescript
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Logger } from '@dmr.is/logging'

import { IParentService } from '../parent/parent.service.interface'
import { INotificationService } from '../notification/notification.service.interface'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
    @Inject(IParentService)
    private readonly parentService: IParentService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  async create(dto: CreateResourceDto): Promise<ResourceResponseDto> {
    this.logger.info('Creating resource', { dto })

    // Validate parent exists
    const parent = await this.parentService.findById(dto.parentId)
    if (!parent) {
      throw new NotFoundException(
        `Parent with id ${dto.parentId} not found`,
      )
    }

    const resource = await this.resourceModel.create({
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId,
    })

    // Send notification
    await this.notificationService.send({
      type: 'RESOURCE_CREATED',
      resourceId: resource.id,
    })

    this.logger.info('Resource created successfully', { id: resource.id })

    return this.mapToDto(resource)
  }
}
```

## Service with Soft Delete

```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Logger } from '@dmr.is/logging'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  constructor(
    @InjectModel(ResourceModel)
    private readonly resourceModel: typeof ResourceModel,
  ) {}

  async findAll(
    query: GetResourceQueryDto,
  ): Promise<ResourceResponseDto[]> {
    // Only return non-deleted items
    const resources = await this.resourceModel.findAll({
      where: {
        deletedAt: null,
      },
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    })

    return resources.map((r) => this.mapToDto(r))
  }

  async softDelete(id: string): Promise<void> {
    this.logger.info('Soft deleting resource', { id })

    const resource = await this.resourceModel.findByPk(id)

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`)
    }

    // Set deletedAt timestamp
    await resource.update({ deletedAt: new Date() })

    this.logger.info('Resource soft deleted', { id })
  }

  async restore(id: string): Promise<ResourceResponseDto> {
    this.logger.info('Restoring resource', { id })

    const resource = await this.resourceModel.findOne({
      where: { id },
      paranoid: false, // Include soft-deleted records
    })

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`)
    }

    // Clear deletedAt timestamp
    await resource.update({ deletedAt: null })

    this.logger.info('Resource restored', { id })

    return this.mapToDto(resource)
  }
}
```

## Error Handling Patterns

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { Logger } from '@dmr.is/logging'

@Injectable()
export class ResourceService implements IResourceService {
  private readonly logger = Logger.createLogger(ResourceService.name)

  async create(dto: CreateResourceDto): Promise<ResourceResponseDto> {
    try {
      // Check for duplicate
      const existing = await this.resourceModel.findOne({
        where: { name: dto.name },
      })

      if (existing) {
        throw new ConflictException(
          `Resource with name "${dto.name}" already exists`,
        )
      }

      // Validate business rules
      if (dto.price < 0) {
        throw new BadRequestException('Price cannot be negative')
      }

      const resource = await this.resourceModel.create(dto)

      return this.mapToDto(resource)
    } catch (error) {
      this.logger.error('Failed to create resource', {
        error: error.message,
        dto,
      })
      throw error
    }
  }
}
```

## Important Notes

- Always use `Logger.createLogger()` from `@dmr.is/logging` for NestJS services
- Never use `console.log` - always use the logger
- Log at appropriate levels: `info`, `warn`, `error`
- Include relevant context in log messages (IDs, names, etc.)
- Mask sensitive data (national IDs are auto-masked by logger)
- Use transactions for operations that modify multiple tables
- Always validate related entities exist before creating foreign keys
- Use `findAndCountAll()` for pagination with total count
- Use soft deletes (`deletedAt`) instead of hard deletes when appropriate
- Throw appropriate NestJS exceptions (NotFoundException, BadRequestException, etc.)
- Keep mapping logic in private methods for reusability
