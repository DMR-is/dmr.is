import { ApiProperty } from '@nestjs/swagger'

import { CourtDistrictDto } from '../../../court-district/dto/court-district.dto'
import { ApplicationStatusEnum } from '../../contants'

export class BankruptcyApplicationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  caseId!: string

  @ApiProperty({ type: String, required: false })
  additionalText?: string

  @ApiProperty({ type: String, required: false })
  judgmentDate?: string

  @ApiProperty({ enum: ApplicationStatusEnum, required: true })
  status?: ApplicationStatusEnum

  @ApiProperty({ type: String, required: false })
  signatureLocation?: string

  @ApiProperty({ type: String, required: false })
  signatureDate?: string

  @ApiProperty({ type: String, required: false })
  liquidator?: string

  @ApiProperty({ type: String, required: false })
  liquidatorLocation?: string

  @ApiProperty({ type: String, required: false })
  liquidatorOnBehalfOf?: string

  @ApiProperty({ type: String, required: false })
  settlementName?: string

  @ApiProperty({ type: String, required: false })
  settlementDeadline?: string

  @ApiProperty({ type: String, required: false })
  settlementAddress?: string

  @ApiProperty({ type: String, required: false })
  settlementNationalId?: string

  @ApiProperty({ type: String, required: false })
  settlementMeetingLocation?: string

  @ApiProperty({ type: String, required: false })
  settlementMeetingDate?: string

  @ApiProperty({ type: CourtDistrictDto, required: false })
  courtDistrict?: CourtDistrictDto

  @ApiProperty({ type: [String], required: false })
  publishingDates?: string[]
}
