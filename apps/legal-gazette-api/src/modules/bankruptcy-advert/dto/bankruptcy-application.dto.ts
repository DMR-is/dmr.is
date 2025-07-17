import { ApiProperty } from '@nestjs/swagger'

import { CourtDistrictDto } from '../../court-district/dto/court-district.dto'

export class BankruptcyApplicationDto {
  @ApiProperty({ type: String, nullable: true, required: false })
  additionalText?: string | null

  @ApiProperty({ type: Date, nullable: true, required: false })
  judgmentDate?: Date | null

  @ApiProperty({ type: String, nullable: true, required: false })
  claimsSentTo?: string | null

  @ApiProperty({ type: String, nullable: true, required: false })
  signatureLocation?: string | null

  @ApiProperty({ type: Date, nullable: true, required: false })
  signatureDate?: Date | null

  @ApiProperty({ type: String, nullable: true, required: false })
  signatureName?: string | null

  @ApiProperty({ type: String, nullable: true, required: false })
  signatureOnBehalfOf?: string | null

  @ApiProperty({ type: [Date], nullable: true, required: false })
  publishingDates?: Date[] | null

  @ApiProperty({ type: String, nullable: true, required: false })
  locationName?: string | null

  @ApiProperty({ type: String, nullable: true, required: false })
  locationDeadline?: string | null

  @ApiProperty({ type: String, nullable: true, required: false })
  locationAddress?: string | null

  @ApiProperty({ type: String, nullable: true, required: false })
  locationNationalId?: string | null

  @ApiProperty({ type: String })
  caseId!: string

  @ApiProperty({ type: CourtDistrictDto, nullable: true, required: false })
  courtDistrict?: CourtDistrictDto | null
}
