import { IsArray, IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateAdvert {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsUUID()
  departmentId!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsUUID()
  statusId!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsUUID()
  involvedPartyId!: string

  @ApiProperty({
    type: [String],
    required: true,
  })
  @IsUUID(undefined, { each: true })
  @IsArray()
  categoryIds!: string[]

  @ApiProperty({
    type: String,
    required: true,
  })
  subject!: string

  @ApiProperty({
    type: Number,
    required: true,
  })
  publicationNumber!: number

  @ApiProperty({
    type: Date,
    required: true,
  })
  publicationDate!: Date

  @ApiProperty({
    type: Date,
    required: true,
  })
  signatureDate!: Date

  @ApiProperty({
    type: Boolean,
    required: true,
  })
  isLegacy!: boolean

  @ApiProperty({
    type: String,
    required: true,
  })
  documentHtml!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  documentPdfUrl!: string

  @ApiProperty({
    type: [String],
    required: true,
  })
  @IsArray()
  attachments!: string[]
}
