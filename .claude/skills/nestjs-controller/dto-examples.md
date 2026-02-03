# DTO Examples and Patterns

Complete examples of DTOs for NestJS controllers following DMR.is conventions.

## Request DTOs

### Create DTO

```typescript
// dto/create-{resource}.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsNotEmpty, MaxLength } from 'class-validator'

export class CreateResourceDto {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Example Resource',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'This is a description',
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: 'Reference to parent entity UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parentId!: string
}
```

### Update DTO

```typescript
// dto/update-{resource}.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, MaxLength } from 'class-validator'

export class UpdateResourceDto {
  @ApiPropertyOptional({
    description: 'Name of the resource',
    example: 'Updated Resource Name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string
}
```

## Response DTOs

### Basic Response DTO

```typescript
// dto/{resource}-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ResourceResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Name of the resource',
    example: 'Example Resource',
  })
  name!: string

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'This is a description',
  })
  description?: string

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-16T10:30:00Z',
  })
  createdAt!: Date

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-16T12:30:00Z',
  })
  updatedAt!: Date
}
```

### Paginated Response DTO

```typescript
// dto/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data!: T[]

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total!: number

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  pageSize!: number

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages!: number
}
```

## Query DTOs

### Basic Query with Pagination

```typescript
// dto/get-{resource}-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class GetResourceQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiPropertyOptional({
    description: 'Search term',
    example: 'search text',
  })
  @IsOptional()
  @IsString()
  search?: string
}
```

### Query with Enum Filter

```typescript
// dto/get-{resource}-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsEnum } from 'class-validator'

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class GetResourceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ResourceStatus,
    example: ResourceStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus
}
```

### Query with Date Range

```typescript
// dto/get-{resource}-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsDate } from 'class-validator'
import { Type } from 'class-transformer'

export class GetResourceQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2025-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2025-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date
}
```

### Query with Sorting

```typescript
// dto/get-{resource}-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsEnum, IsIn } from 'class-validator'

export enum ResourceSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class GetResourceQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ResourceSortField,
    default: ResourceSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ResourceSortField)
  sortBy?: ResourceSortField = ResourceSortField.CREATED_AT

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC'
}
```

## Nested DTOs

### DTO with Nested Objects

```typescript
// dto/create-{resource}.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class AddressDto {
  @ApiProperty({ example: 'Reykjavik' })
  @IsString()
  @IsNotEmpty()
  city!: string

  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  postalCode!: string
}

export class CreateResourceDto {
  @ApiProperty({ example: 'Resource Name' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto
}
```

### DTO with Array of Nested Objects

```typescript
// dto/create-{resource}.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUUID, ValidateNested, IsArray } from 'class-validator'
import { Type } from 'class-transformer'

export class ItemDto {
  @ApiProperty({ example: 'Item name' })
  @IsString()
  name!: string

  @ApiProperty({ example: 10 })
  @IsInt()
  quantity!: number
}

export class CreateResourceDto {
  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[]
}
```

## Common Validation Patterns

### Icelandic National ID (Kennitala)

```typescript
import { IsString, Matches } from 'class-validator'

export class CreatePersonDto {
  @ApiProperty({
    description: 'Icelandic national ID (kennitala)',
    example: '0101302399',
  })
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'National ID must be 10 digits',
  })
  nationalId!: string
}
```

### Phone Number

```typescript
import { IsString, Matches } from 'class-validator'

export class CreateContactDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+3545551234',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format',
  })
  phone!: string
}
```

### Email

```typescript
import { IsEmail } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string
}
```

### URL

```typescript
import { IsUrl } from 'class-validator'

export class CreateLinkDto {
  @ApiProperty({
    description: 'Website URL',
    example: 'https://example.com',
  })
  @IsUrl()
  url!: string
}
```

## Boolean and Numeric Types

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean

  @ApiProperty({
    description: 'Price in ISK',
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  price!: number

  @ApiProperty({
    description: 'Quantity in stock',
    example: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number

  @ApiPropertyOptional({
    description: 'Discount percentage',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discount?: number
}
```

## Index File

```typescript
// dto/index.ts
export * from './create-{resource}.dto'
export * from './update-{resource}.dto'
export * from './get-{resource}-query.dto'
export * from './{resource}-response.dto'
export * from './paginated-response.dto'
```

## Important Notes

- Always use `@ApiProperty()` or `@ApiPropertyOptional()` for Swagger docs
- Use `@Type()` transformer for numbers and dates in query params
- Use `!` (definite assignment) for required fields, `?` for optional
- Use `@IsNotEmpty()` with `@IsString()` for required strings
- Use `@MaxLength()` to prevent overly long strings
- Use proper examples in `@ApiProperty()` for better Swagger docs
- Export all DTOs from `dto/index.ts` for clean imports
