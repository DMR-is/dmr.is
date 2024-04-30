import { IsDateString, IsEnum, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseCommunicationStatus, CaseTag } from './case-constants'

export class CaseWithApplication {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  readonly caseId!: string

  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  readonly applicationId!: string

  @ApiProperty({
    type: String,
    example: '244',
  })
  readonly publicationNumber!: string | null

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  readonly fastTrack!: boolean

  @ApiProperty({
    enum: CaseCommunicationStatus,
    example: CaseCommunicationStatus.Done,
  })
  @IsEnum(CaseCommunicationStatus)
  readonly communicationStatus!: CaseCommunicationStatus

  @ApiProperty({
    enum: CaseTag,
    example: CaseTag.InReview,
  })
  @IsEnum(CaseTag)
  readonly tag!: CaseTag | null

  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  readonly requestedPublicationDate!: string

  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  readonly createdDate!: string

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ',
  })
  readonly advertDepartment!: string

  @ApiProperty({
    type: String,
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
  })
  readonly advertTitle!: string

  @ApiProperty({
    type: String,
    example: 'Ármann',
  })
  readonly assignee!: string | null

  @ApiProperty({
    type: String,
    example: 'Reykjavíkurborg',
  })
  institutionTitle!: string | null
}
