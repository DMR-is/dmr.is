import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator'

export class JournalGetTypesQueryParams {
  @ApiProperty({
    name: 'department',
    description: 'Department id to get categories for.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string

  @ApiProperty({
    name: 'includeDepartment',
    description: 'Include department details in response.',
    type: Boolean,
    required: false,
  })
  includeDepartment?: boolean

  @ApiProperty({
    name: 'search',
    description: 'String to search for in types.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: Number,
    required: false,
  })
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number
}
