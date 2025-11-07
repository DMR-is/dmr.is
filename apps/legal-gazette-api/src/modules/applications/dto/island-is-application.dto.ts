import { Expose, Transform, Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBase64,
  IsDateString,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

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
  typeId!: string

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: String, required: true })
  @IsString()
  caption!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsString()
  additionalText?: string | null

  @ApiProperty({ type: String, required: false })
  @IsString()
  signatureName?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  signatureOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsDateString()
  signatureDate?: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: true })
  @IsArray()
  @Type(() => CreateCommunicationChannelDto)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  communicationChannels!: CreateCommunicationChannelDto[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsDateString()
  @ValidateNested({ each: true })
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
