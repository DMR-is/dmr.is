import { ApiProperty } from '@nestjs/swagger'

// Here we store the fields we want to be able to differentiate between,
// when we are comparing the case history of the case.
export class CaseHistory {
  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
  })
  readonly date!: string

  @ApiProperty({
    description:
      'Requested publication date of the advert in the submitted application',
    type: String,
    example: '2006-10-17 00:00:00.0000',
    required: true,
    nullable: false,
  })
  readonly requestedPublicationDate!: string

  @ApiProperty({
    description: 'Application selected department id',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly department!: string

  @ApiProperty({
    description: 'Subject of the advert',
    type: String,
    example: 'fyrir ...',
    required: true,
    nullable: false,
  })
  readonly type!: string

  @ApiProperty({
    description: 'Subject of the advert',
    type: String,
    example: 'fyrir ...',
    required: true,
    nullable: false,
  })
  readonly subject!: string
}
