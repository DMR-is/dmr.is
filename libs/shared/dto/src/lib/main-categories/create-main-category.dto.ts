import { IsArray, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

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
