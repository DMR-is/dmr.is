import { Type } from 'class-transformer'
import {
  IsDate,
  IsDefined,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiDate,
  ApiDateTime,
  ApiDto,
  ApiHTML,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import {
  ApplicationDetailedDto,
  ApplicationDto,
} from '../../../models/application.dto'
import { CreateSignatureDto } from '../../advert/signature/dto/signature.dto'

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

  @ApiHTML({ required: false })
  @IsOptional()
  content?: string

  @ApiProperty({ type: String })
  @Type(() => Date)
  @IsDate()
  meetingDate!: Date

  @ApiDateTime()
  scheduledAt!: Date

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

  @ApiDate()
  endingDate!: Date

  @ApiOptionalNumber()
  declaredClaims?: number

  @ApiDto(CreateSignatureDto)
  signature!: CreateSignatureDto
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

export class GetApplicationAdvertPriceDto {
  @ApiOptionalNumber({
    description:
      'Total price of the adverts belonging to the application. Omitted when the price cannot be calculated.',
  })
  totalPrice?: number

  @ApiBoolean({
    description:
      'True when at least one of the adverts has not been charged yet, meaning the total is an estimate.',
  })
  isEstimate!: boolean
}

export { ApplicationDetailedDto }
