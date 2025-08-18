import { Transform } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationStatusEnum } from '../../../contants'

export class CommonApplicationDto {
  @ApiProperty({ type: String, required: true, nullable: false })
  id!: string

  @ApiProperty({ type: String, required: true, nullable: false })
  caseId!: string

  @ApiProperty({ type: String, required: true, nullable: false })
  involvedPartyNationalId!: string

  @ApiProperty({ type: String, required: true, nullable: false })
  title!: string

  @ApiProperty({ type: String, required: false, nullable: true })
  caption?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  signatureName?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  signatureLocation?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  signatureDate?: string | null

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
    required: true,
    nullable: false,
  })
  status!: ApplicationStatusEnum

  @ApiProperty({ type: String, required: false, nullable: true })
  @Transform(({ value }) => {
    if (!value) {
      return value
    }

    const base64 = Buffer.from(value, 'utf-8').toString('base64')

    return base64
  })
  html?: string | null

  @ApiProperty({ type: String, required: false, nullable: true })
  categoryId?: string | null

  @ApiProperty({ type: [String], required: false })
  publishingDates?: string[]
}
