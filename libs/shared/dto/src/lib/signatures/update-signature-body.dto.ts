import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { UpdateSignatureMember } from './signature-member.dto'

/**
 * The update signature body
 * @export UpdateSignatureBody
 */
export class UpdateSignatureBody {
  @ApiProperty({
    type: String,
    required: false,
    description: 'The name of the institution responsible for the signature',
  })
  @IsOptional()
  @IsString()
  institution?: string

  /**
   * The date when the institution signed the signature ISO 8601 format
   * @type {string}
   */
  @ApiProperty({
    type: String,
    required: false,
    description: 'Date when the institution signed the signature',
  })
  @IsOptional()
  @IsDateString()
  date?: string

  /**
   * The chairman of the signature,
   * if chairman is not provided then the type of the signature is regular
   * @type {SignatureMember}
   */
  @ApiProperty({
    type: UpdateSignatureMember,
    required: false,
    description: 'The chairman of the signature',
  })
  @IsOptional()
  @Type(() => UpdateSignatureMember)
  chairman?: UpdateSignatureMember

  @ApiProperty({
    type: String,
    required: false,
    description: 'Additional signature member name',
  })
  @IsOptional()
  @IsString()
  additionalSignature?: string
}
