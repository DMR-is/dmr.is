import { Expose, Transform } from 'class-transformer'
import { IsBase64, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'

export enum IslandIsCommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class IslandIsSubmitCommonApplicationDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  islandIsApplicationId!: string

  @ApiProperty({ type: String })
  @IsBase64()
  htmlBase64!: string

  @Expose()
  @IsString()
  @Transform(({ obj }) =>
    Buffer.from(obj.htmlBase64, 'base64').toString('utf-8'),
  )
  html!: string

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  caption!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsString()
  additionalText?: string | null

  @ApiProperty({ type: String, required: true })
  @IsString()
  signatureName!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsString()
  signatureOnBehalfOf?: string | null

  @ApiProperty({ type: String, required: true })
  @IsString()
  signatureLocation!: string

  @ApiProperty({ type: String, required: true, format: 'date-time' })
  @IsString()
  signatureDate!: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: true })
  communicationChannels!: CreateCommunicationChannelDto[]

  @ApiProperty({
    type: [String],
    required: true,
    format: 'date-time',
    isArray: true,
  })
  publishingDates!: string[]
}

export class IslandIsCommonApplicationUpdateStateEventDto {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    enum: IslandIsCommonApplicationEventsEnum,
    enumName: 'CommonApplicationEvents',
  })
  event!: IslandIsCommonApplicationEventsEnum
}
