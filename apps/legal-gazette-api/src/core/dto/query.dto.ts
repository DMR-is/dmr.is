import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { PagingQuery } from '@dmr.is/shared/dto'

export class QueryDto extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiProperty({
    enum: ['asc', 'desc'],
    enumName: 'SortDirectionEnum',
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc'

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  search?: string
}
