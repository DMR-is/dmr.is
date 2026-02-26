import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDate,
  IsDefined,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator'
import { isBase64 } from 'validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiDto,
  ApiHTML,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import { AdvertDto } from '../../../models/advert.model'
import {
  ApplicationDetailedDto,
  ApplicationDto,
} from '../../../models/application.model'
import { CreateSignatureDto } from '../../advert/signature/dto/signature.dto'

export class ApplicationDtoWithSubtitle extends ApplicationDto {
  subtitle?: string
}

export class GetApplicationsDto {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class UpdateApplicationDto {
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsNumber()
  currentStep?: number

  @ApiProperty({ type: Object, default: {} })
  @IsOptional()
  @IsObject()
  answers?: Record<string, any>
}

export class CreateDivisionMeetingDto {
  @ApiOptionalString()
  additionalText?: string

  @ApiProperty({ type: String })
  @Type(() => Date)
  @IsDate()
  meetingDate!: Date

  @ApiString()
  meetingLocation!: string

  @ApiProperty({ type: CreateSignatureDto })
  @IsDefined()
  @Type(() => CreateSignatureDto)
  @ValidateNested()
  signature!: CreateSignatureDto
}

export class CreateDivisionEndingDto {
  @ApiOptionalString()
  additionalText?: string

  @ApiHTML({ required: false })
  @IsOptional()
  content?: string

  @ApiDateTime()
  scheduledAt!: Date

  @ApiDateTime()
  endingDate!: Date

  @ApiOptionalNumber()
  declaredClaims?: number

  @ApiDto(CreateSignatureDto)
  signature!: CreateSignatureDto
}

export class IslandIsSubmitApplicationDto extends PickType(
  CreateDivisionMeetingDto,
  ['signature', 'additionalText'] as const,
) {
  @ApiUUId()
  islandIsApplicationId!: string

  @ApiUUId()
  typeId!: string

  @ApiUUId()
  categoryId!: string

  @ApiString()
  caption!: string

  @ApiString()
  @Transform(({ value }) => {
    if (isBase64(value)) {
      return Buffer.from(value, 'base64').toString('utf-8')
    }
    return value
  })
  html!: string

  @ApiProperty({ type: [String] })
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @Type(() => Date)
  @IsDate({ each: true })
  publishingDates!: Date[]
}

export class GetHTMLPreview {
  @ApiProperty({ type: String })
  preview!: string
}

export class GetMinDateResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  minDate!: Date
}

export class GetApplicationEstimatedPriceDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  price!: number
}

export { ApplicationDetailedDto }
