import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'
import { BaseEntity } from '@dmr.is/shared/dto'
import { IsArray, IsString, IsUUID } from 'class-validator'

export class CategoryMainCategory extends BaseEntity {
  @ApiProperty({
    description: 'Description of the main category, used on front page.',
    example: 'Hæstiréttur, lögmenn, lögreglumál, dómsmál og landsdómur.',
    required: true,
    type: String,
  })
  readonly description!: string
}

export class Category extends BaseEntity {
  readonly mainCategories?: CategoryMainCategory[]
}

export class MainCategory {
  @ApiProperty({
    description: 'Unique ID for the main category, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the main category.',
    example: 'Dómstólar og réttarfar',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the main category, used in URLs and API requests.',
    example: 'domstolar-og-rettarfar',
    required: true,
    type: String,
  })
  readonly slug!: string

  @ApiProperty({
    description: 'Department linked to category.',
    example: '00000000-0000-0000-0000-000000000000',
    type: String,
  })
  readonly departmentId!: string

  @ApiProperty({
    description: 'Description of the main category, used on front page.',
    example: 'Hæstiréttur, lögmenn, lögreglumál, dómsmál og landsdómur.',
    required: true,
    type: String,
  })
  readonly description!: string

  @ApiProperty({
    isArray: true,
    type: () => Category,
    description: 'List of sub categories under this main category.',
    required: true,
  })
  readonly categories!: Category[]
}

export class CreateMainCategory {
  @ApiProperty({
    type: String,
    description: 'Title of the main category.',
  })
  @IsString()
  readonly title!: string

  @ApiProperty({
    type: String,
    description: 'Description of the main category',
  })
  @IsString()
  readonly description!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  readonly departmentId!: string

  @ApiProperty({
    type: [String],
    description: 'Sub categories under this main category',
  })
  @IsUUID(undefined, { each: true })
  @IsArray()
  readonly categories!: string[]
}

export class CreateCategory extends PickType(CreateMainCategory, [
  'title',
] as const) {}

export class UpdateCategory extends PartialType(CreateCategory) {}
