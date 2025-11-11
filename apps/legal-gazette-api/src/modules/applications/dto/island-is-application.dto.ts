import { Expose, Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBase64,
  IsDateString,
  IsOptional,
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

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  additionalText?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureName?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
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
  @IsDateString({}, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
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
