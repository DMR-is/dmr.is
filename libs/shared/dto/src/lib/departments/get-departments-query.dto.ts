import { ApiProperty } from '@nestjs/swagger'
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class GetDepartmentsQueryParams {
  @ApiProperty({
    name: 'search',
    description: 'String to search for in departments.',
    type: String,
    required: false,
  })
  @MaxLength(1024)
  @IsString()
  @IsOptional()
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
