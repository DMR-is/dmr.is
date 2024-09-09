import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationCommunicationChannel {
  @ApiProperty({
    type: String,
    example: 'test@test.is',
    description: 'Email of the communication channel',
  })
  @IsOptional()
  channel!: string

  @ApiProperty({
    type: String,
    example: '555 5555',
    description: 'Phone number of the communication channel',
  })
  @IsOptional()
  phone!: string
}

/**
 * Application advert fields, we use these fields to create a new case in the system
 */
export class ApplicationAdvert {
  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Id of the selected department',
  })
  @IsUUID()
  departmentId!: string

  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Id of the selected type',
  })
  @IsUUID()
  typeId!: string

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
    type: [String],
  })
  @IsUUID(undefined, { each: true })
  categories!: string[]

  @ApiProperty({
    type: [ApplicationCommunicationChannel],
    description: 'Communication channels',
  })
  @IsOptional()
  channels?: ApplicationCommunicationChannel[]

  @ApiProperty({
    type: String,
    example: 'Some message to the admins',
    description: 'Message to the admins of the advert',
  })
  @IsOptional()
  message?: string
}
