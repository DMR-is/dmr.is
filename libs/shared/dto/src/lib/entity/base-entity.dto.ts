import { ApiProperty } from '@nestjs/swagger'

/**
 * This DTO represents the base entity.
 * Used for entities that have an id, title and slug.
 * Can be extended with mapped types using NestJS
 * - This allows for better consistensy through out the codebase
 * - and DRU (Don't Repeat Yourself)
 * - https://docs.nestjs.com/openapi/mapped-types
 */
export class BaseEntity {
  @ApiProperty({
    type: String,
    description: 'Id of the entity',
  })
  id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the entity',
  })
  title!: string

  @ApiProperty({
    type: String,
    description: 'Slug of the entity',
  })
  slug!: string
}
