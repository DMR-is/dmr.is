import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { AdditionTypeEnum } from '@dmr.is/official-journal/models'
import { BaseEntity } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

export class OJOIApplicationCommunicationChannel {
  @ApiProperty({
    type: String,
  })
  name!: string

  @ApiProperty({
    type: String,
    example: 'test@test.is',
    description: 'Email of the communication channel',
  })
  @IsOptional()
  email!: string

  @ApiProperty({
    type: String,
    example: '555 5555',
    description: 'Phone number of the communication channel',
    required: true,
  })
  @IsOptional()
  phone?: string
}

export class OJOIApplicationAddition {
  @ApiProperty({
    type: String,
    description: 'Id of the addition',
  })
  @IsUUID()
  @IsOptional()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the addition',
  })
  @IsString()
  @IsOptional()
  title!: string

  @ApiProperty({
    type: String,
    description: 'Content of the addition (html)',
  })
  @IsString()
  @IsOptional()
  content?: string

  @ApiProperty({
    enum: AdditionTypeEnum,
    description: 'Type of the addition',
  })
  @IsEnum(AdditionTypeEnum)
  @IsOptional()
  type!: AdditionTypeEnum
}

/**
 * Application advert fields, we use these fields to create a new case in the system
 */
export class OJOIApplicationAdvert {
  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Id of the involved party',
  })
  @IsUUID()
  involvedPartyId!: string

  @ApiProperty({
    type: BaseEntity,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Id of the selected department',
  })
  department!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Id of the selected type',
  })
  type!: BaseEntity

  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Title of the advert',
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'HTML contents of the advert',
  })
  @IsString()
  html!: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Request advert publcation date',
  })
  @IsDateString()
  requestedDate!: string

  @ApiProperty({
    type: [BaseEntity],
  })
  @IsUUID(undefined, { each: true })
  categories!: BaseEntity[]

  @ApiProperty({
    type: [OJOIApplicationCommunicationChannel],
    description: 'Communication channels',
  })
  @IsOptional()
  channels?: OJOIApplicationCommunicationChannel[]

  @ApiProperty({
    type: [OJOIApplicationAddition],
    description: 'Additions to the advert',
  })
  @IsOptional()
  additions?: OJOIApplicationAddition[]

  @ApiProperty({
    type: String,
    example: 'Some message to the admins',
    description: 'Message to the admins of the advert',
  })
  @IsOptional()
  message?: string
}
