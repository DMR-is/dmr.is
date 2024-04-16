import { ApiProperty } from '@nestjs/swagger'

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
    type: String,
    example: 'draft',
    description: 'State of the application',
  })
  state!: string

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
}
