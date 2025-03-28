import { IsBoolean, IsDateString, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
import { CaseStatusEnum } from '@dmr.is/official-journal/models'

// This is a Partial DTO of Case, intended for public API responses
export class CaseInProgress {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsString()
  @IsUUID()
  readonly id!: string

  @ApiProperty({
    enum: CaseStatusEnum,
    example: 'Innsent',
    description: 'Status of the case',
  })
  status!: CaseStatusEnum

  @ApiProperty({
    description: 'Title of the institution',
    example: 'Dómsmálaráðuneytið',
    required: true,
    type: String,
  })
  involvedParty!: string

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Date the case was created. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  readonly createdAt!: string

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Requested fast track',
  })
  @IsBoolean()
  fastTrack!: boolean

  @ApiProperty({
    type: String,
    example: '2024-01-01T09:00:00Z',
    description:
      'Requested advert publication date. ISO 8601 date and time format in UTC.',
  })
  @IsDateString()
  requestedPublicationDate!: string

  @ApiProperty({
    type: String,
    example: 'TITILL á máli',
    description: 'Advert title with type',
  })
  @IsString()
  title!: string
}
