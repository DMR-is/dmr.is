import { ApiProperty } from '@nestjs/swagger'
import { JournalSignatureType } from '../journal-constants.dto'
import { JournalSignatureMember } from './journal-signature-member.dto'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateIf,
} from 'class-validator'
import { Type } from 'class-transformer'

export class JournalSignatureBody {
  @ApiProperty({
    enum: JournalSignatureType,
    example: JournalSignatureType.Regular,
    required: true,
    nullable: false,
  })
  @IsEnum(JournalSignatureType)
  type!: JournalSignatureType

  @ApiProperty({
    type: String,
    example: 'Dagur B. Eggertsson',
    required: true,
    nullable: false,
  })
  @IsString()
  @ValidateIf((_, value) => value !== null)
  additional!: string | null

  @ApiProperty({
    type: [JournalSignatureMember],
    required: true,
    nullable: false,
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => JournalSignatureMember)
  members!: JournalSignatureMember[]
}
