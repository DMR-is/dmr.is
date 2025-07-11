import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommunicationChannelDto } from '../../communication-channel/dto/communication-channel.dto'

export class CreateCommonAdvertSignatureDto {
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

export class CreateCommonAdvertDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  caption!: string

  @ApiProperty({ type: [CreateCommunicationChannelDto], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => CreateCommunicationChannelDto)
  channels?: CreateCommunicationChannelDto[]

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string

  @ApiProperty({ type: CreateCommonAdvertSignatureDto })
  @ValidateNested()
  @Type(() => CreateCommonAdvertSignatureDto)
  signature!: CreateCommonAdvertSignatureDto

  @ApiProperty({ type: [String] })
  @IsArray()
  @Type(() => String)
  @ArrayMinSize(0)
  @ArrayMaxSize(3)
  @Transform(({ value }: { value: string[] }) =>
    value.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
  )
  publishingDates!: string[]
}

export class CreateCommonAdvertInternalDto extends CreateCommonAdvertDto {
  @ApiProperty({ type: String })
  @IsString()
  involvedPartyNationalId!: string

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  html?: string

  @ApiProperty({ type: String })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  submittedBy!: string
}
