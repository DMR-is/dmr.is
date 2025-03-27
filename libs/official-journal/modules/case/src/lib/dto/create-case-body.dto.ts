import { ApiProperty } from '@nestjs/swagger'

export class CreateCaseBody {
  @ApiProperty({
    type: String,
    required: true,
  })
  id!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  applicationId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  statusId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  tagId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  communicationStatusId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  involvedPartyId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  departmentId!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  advertTypeId!: string
  @ApiProperty({
    type: Number,
    required: true,
  })
  year!: number

  @ApiProperty({
    type: String,
    required: true,
  })
  caseNumber!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  advertTitle!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  html!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  requestedPublicationDate!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  assignedUserId!: string | null
  @ApiProperty({
    type: String,
    required: true,
  })
  publishedAt!: string | null
  @ApiProperty({
    type: Number,
    required: true,
  })
  price!: number
  @ApiProperty({
    type: Boolean,
    required: true,
  })
  paid!: boolean
  @ApiProperty({
    type: Boolean,
    required: true,
  })
  fastTrack!: boolean
  @ApiProperty({
    type: String,
    required: true,
  })
  message!: string | null
  @ApiProperty({
    type: Boolean,
    required: true,
  })
  isLegacy!: boolean
  @ApiProperty({
    type: String,
    required: true,
  })
  createdAt!: string
  @ApiProperty({
    type: String,
    required: true,
  })
  updatedAt!: string
}
