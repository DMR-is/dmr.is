import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationBody {
  @ApiProperty({
    description: 'Application id',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly applicationId!: string

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
    description: 'Title of the advert',
    type: String,
    example: 'GJALDSKRÁ fyrir ...',
    required: true,
    nullable: false,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Title of the advert',
    type: String,
    example: 'GJALDSKRÁ fyrir ...',
    required: true,
    nullable: false,
  })
  readonly institutionId!: string
}
