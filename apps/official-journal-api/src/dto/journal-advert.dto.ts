import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertPublicationNumber } from './journal-advert-publication-number.dto'
import { JournalAdvertCategory } from './journal-category.dto'
import { JournalAdvertStatus, JournalDepartment } from './journal-constants.dto'
import { JournalDocument } from './journal-document'
import { JournalInvolvedParty } from './journal-involved-party.dto'

export class JournalAdvert {
  @ApiProperty({
    description: 'Unique ID for the advert, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly id!: string

  @ApiProperty({
    enum: JournalDepartment,
    description: 'The department the advert is for.',
    required: true,
    nullable: false,
    example: 'A deild',
  })
  readonly department!: JournalDepartment

  @ApiProperty({
    description:
      'Type of the advert, always uppercased. Must be available under the given `department`.',
    example: 'GJALDSKRÁ',
    required: true,
  })
  readonly type!: string

  @ApiProperty({
    description: 'Subject of the advert, always dependant on the `type`.',
    example: 'fyrir hundahald í Reykjavíkurborg.',
    required: false,
  })
  readonly subject!: string

  @ApiProperty({
    description: 'Title of the advert with both `type` and `subject`.',
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
    required: true,
  })
  readonly title!: string

  @ApiProperty({
    enum: JournalAdvertStatus,
    description: 'Status of the advert',
    required: true,
    nullable: false,
    example: 'Virk',
  })
  readonly status!: JournalAdvertStatus

  @ApiProperty({
    description: 'Publication number of the advert',
    required: true,
    nullable: true,
  })
  readonly publicationNumber!: JournalAdvertPublicationNumber

  @ApiProperty({
    description:
      'Date the advert was created. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: false,
    example: '2024-01-01T09:00:00Z',
  })
  readonly createdDate!: string

  @ApiProperty({
    description:
      'Date the advert was last updated. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: false,
    example: '2024-01-20T09:00:00Z',
  })
  readonly updatedDate!: string

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    example: '2024-01-10T16:00:00Z',
  })
  readonly signatureDate!: string | null

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    example: '2024-01-20T09:00:00Z',
  })
  readonly publicationDate!: string | null

  @ApiProperty({
    description: 'List of advert categories.',
    required: true,
    type: [JournalAdvertCategory],
    nullable: false,
  })
  readonly categories!: JournalAdvertCategory[]

  @ApiProperty({
    description: 'Involved party for the advert.',
    required: true,
    nullable: false,
  })
  readonly involvedParty!: JournalInvolvedParty

  @ApiProperty({
    description: 'Advert document in different formats.',
    required: true,
    nullable: false,
  })
  readonly document!: JournalDocument
}
