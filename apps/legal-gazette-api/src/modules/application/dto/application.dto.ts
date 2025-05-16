import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'

import {
  IsBase64,
  IsDateString,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'

export class CommunicationChannelDto {
  @ApiProperty({ type: String })
  @IsEmail()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  email!: string

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  phone?: string
}

export class SignatureDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  location!: string

  @ApiProperty({ type: String })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  date!: string
}

export class SubmitApplicationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  caption!: string

  @ApiProperty({ type: String })
  @IsBase64()
  htmlBase64!: string

  @Expose()
  @IsString()
  @Transform(({ obj }) =>
    Buffer.from(obj.htmlBase64, 'base64').toString('utf-8'),
  )
  html!: string

  @ApiProperty({ type: SignatureDto })
  @Type(() => SignatureDto)
  signature!: SignatureDto

  @ApiProperty({ type: [CommunicationChannelDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => CommunicationChannelDto)
  @ValidateNested({ each: true })
  channels!: CommunicationChannelDto[]

  @ApiProperty({ type: [String] })
  @IsArray()
  @Type(() => String)
  @ArrayMinSize(0)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  publishingDates!: string[]
}
