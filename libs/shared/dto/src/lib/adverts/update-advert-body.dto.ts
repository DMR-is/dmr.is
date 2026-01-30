import { ApiProperty } from '@nestjs/swagger'

export class UpdateAdvertBody {
  @ApiProperty({
    type: String,
    required: false,
  })
  departmentId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  typeId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  statusId?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  subject?: string

  @ApiProperty({
    type: Number,
    required: false,
  })
  serialNumber?: number

  @ApiProperty({
    type: Number,
    required: false,
  })
  publicationYear?: number

  @ApiProperty({
    type: String,
    required: false,
  })
  title?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  documentHtml?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  documentPdfUrl?: string

  @ApiProperty({
    type: String,
    required: false,
  })
  involvedPartyId?: string

  @ApiProperty({
    type: Date,
    required: false,
  })
  signatureDate?: Date

  @ApiProperty({
    type: Date,
    required: false,
  })
  publicationDate?: Date

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  isLegacy?: boolean

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  hideSignatureDate?: boolean
}
