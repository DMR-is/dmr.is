import { IsOptional, IsString, MaxLength } from 'class-validator'
import { PagingQuery } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

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
