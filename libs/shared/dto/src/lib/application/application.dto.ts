import { Type } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationStates } from '@dmr.is/constants'

import { ApplicationAnswers } from './application-answers.dto'

export class Application {
  @ApiProperty({
    type: String,
    example: 'a12c3d4e-5f67-8h90-1i23-j45k6l7m8n9o0',
    description: 'Guid of the application',
  })
  id!: string

  @ApiProperty({
    type: String,
    example: '0101015050',
    description: 'National id of the applicant',
  })
  applicant!: string

  @ApiProperty({
    type: [String],
    example: ['0101015050'],
    description: 'List of assignees',
  })
  assignees!: string[]

  @ApiProperty({
    type: Object,
    description: 'Attachments',
  })
  attachments!: Record<string, string>

  @ApiProperty({
    enum: ApplicationStates,
    example: 'draft',
    description: 'State of the application',
  })
  state!: ApplicationStates

  @ApiProperty({
    type: String,
    example: 'inprogress',
    description: 'Status of the application',
  })
  status!: string

  @ApiProperty({
    type: String,
    example: 'OfficialJournalOfIceland',
    description: 'Type of the application',
  })
  typeId!: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Application creation date',
  })
  created!: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Application last modified date',
  })
  modified!: string

  @ApiProperty({
    type: String,
    example: 'Stjórnartíðindi',
    description: 'Name of the application',
  })
  name!: string

  @ApiProperty({
    type: [String],
    description: 'List of applicant actors',
  })
  applicantActors!: string[]

  @ApiProperty({
    type: ApplicationAnswers,
    description: 'Application answers',
  })
  @Type(() => ApplicationAnswers)
  answers!: ApplicationAnswers

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Is the application listed',
  })
  listed!: boolean

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Prune date of the application',
  })
  prunedAt!: string

  @ApiProperty({
    type: Boolean,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Date of the application',
  })
  pruned!: boolean
}
