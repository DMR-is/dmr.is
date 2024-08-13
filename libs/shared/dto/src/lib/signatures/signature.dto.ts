import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Institution } from '../institutions'
import { SignatureMember } from './signature-member.dto'
import { SignatureType } from './signature-type.dto'

export class Signature {
  @ApiProperty({
    type: String,
    description: 'The id of the signature',
    required: true,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Institution of the signature',
    required: true,
  })
  @IsString()
  institution!: string

  @ApiProperty({
    type: String,
    description: 'ISO datestring of the signature',
    required: true,
  })
  @IsDateString()
  date!: string

  @ApiProperty({
    type: SignatureType,
    description: 'The type of the signature',
    required: true,
  })
  @IsNotEmpty()
  type!: SignatureType

  @ApiProperty({
    type: Institution,
    description: 'The involved party of the signature',
    required: true,
  })
  @IsNotEmpty()
  involvedParty!: Institution

  @ApiProperty({
    type: [SignatureMember],
    description: 'Members of the signature',
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => SignatureMember)
  @ValidateNested({ each: true })
  members!: SignatureMember[]

  @ApiProperty({
    type: SignatureMember,
    description: 'Chairman of the signature',
    required: false,
  })
  @IsNotEmpty()
  @ValidateIf((o) => o.chairman !== null)
  @Type(() => SignatureMember)
  chairman!: SignatureMember | null

  @ApiProperty({
    type: String,
    description: 'Additional signature name',
    required: false,
  })
  @ValidateIf((o) => o.additionalSignature !== null)
  @IsString()
  additionalSignature!: string | null

  @ApiProperty({
    type: String,
    description: 'HTML of the signature',
    required: false,
  })
  @ValidateIf((o) => o.html !== null)
  @IsString()
  html!: string | null
}
