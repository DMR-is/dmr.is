import { IsArray, IsString, IsUUID } from 'class-validator'

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

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

export class MergeCategoriesBody {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  readonly from!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  readonly to!: string
}
