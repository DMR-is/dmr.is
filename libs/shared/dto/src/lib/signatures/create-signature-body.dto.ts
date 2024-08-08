import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { SignatureMember } from './signature-member.dto'

/**
 * The body of the create signature request
 * @export CreateSignatureBody
 * @class CreateSignatureBody
 */
export class CreateSignatureBody {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The name of the institution responsible for the signature',
  })
  institution!: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'Date when the institution signed the signature',
  })
  @IsDateString()
  date!: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The id of the involved party',
  })
  @IsUUID()
  involvedPartyId!: string

  @ApiProperty({
    type: [SignatureMember],
    required: true,
    description: 'The members of the signature',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignatureMember)
  @ArrayMinSize(1)
  members!: SignatureMember[]

  /**
   * The chairman of the signature,
   * if chairman is not provided then the type of the signature is regular
   * @type {SignatureMember}
   */
  @ApiProperty({
    type: SignatureMember,
    required: false,
    description: 'The chairman of the signature',
  })
  @IsOptional()
  @Type(() => SignatureMember)
  chairman?: SignatureMember

  @ApiProperty({
    type: String,
    required: false,
    description: 'Additional signature member name',
  })
  @IsOptional()
  @IsString()
  additionalSignature?: string
}
