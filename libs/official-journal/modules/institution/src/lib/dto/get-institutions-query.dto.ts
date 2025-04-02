import { IsOptional, IsString, MaxLength } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
import { PagingQuery } from '@dmr.is/shared/dto'

export class InstitutionQuery extends PagingQuery {
  @ApiProperty({
    name: 'search',
    description: 'String to search for in institutions.',
    type: String,
    required: false,
  })
  @MaxLength(1024)
  @IsString()
  @IsOptional()
  search?: string
}
