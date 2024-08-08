import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
/**
 * Represents a query to retrieve signatures.
 */
export class GetSignaturesQuery {
  /**
   * String to search for in signatures `institution`.
   *
   */
  @ApiProperty({
    name: 'search',
    description: 'String to search for',
    type: String,
    required: false,
  })
  @IsOptional()
  @MaxLength(1024)
  @IsString()
  search?: string

  /**
   * Involved party id to search for.
   */
  @ApiProperty({
    name: 'involvedPartyId',
    description: 'Involved party id to search for',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  involvedPartyId?: string

  /**
   * Page number to return.
   */
  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @Min(1)
  page?: number

  /**
   * Page size number to return.
   */
  @ApiProperty({
    name: 'pageSize',
    description: 'Page size number to return.',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @Min(1)
  pageSize?: number
}
