import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'
import { JournalSignatureType } from '../journal-constants.dto'

export class JournalGetSignaturesQueryParams {
  @ApiProperty({
    name: 'type',
    description: 'To fetch specfic type of signatures',
    enum: JournalSignatureType,
    required: false,
  })
  @IsOptional()
  @IsEnum(JournalSignatureType)
  type?: JournalSignatureType

  @ApiProperty({
    name: 'search',
    description: 'String to search for in categories.',
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
