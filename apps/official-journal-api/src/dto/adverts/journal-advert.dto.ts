import { ApiProperty } from '@nestjs/swagger'
import { JournalAdvertPublicationNumber } from './journal-advert-publication-number.dto'
import { JournalAdvertCategory } from '../categories/journal-category.dto'
import { JournalAdvertStatus } from '../journal-constants.dto'
import { JournalDocument } from '../journal-document'
import { JournalInvolvedParty } from '../journal-involved-party.dto'
import { JournalAdvertDepartment } from '../departments/journal-department.dto'
import { JournalAdvertType } from '../types/journal-advert-type.dto'

export class JournalAdvert {
  @ApiProperty({
    description: 'Unique ID for the advert, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'The department the advert is for.',
    required: true,
    nullable: false,
    type: JournalAdvertDepartment,
    example: 'A deild',
  })
  readonly department!: JournalAdvertDepartment

  @ApiProperty({
    description: 'Type of the advert.',
    example: 'GJALDSKRÁ',
    required: true,
    type: JournalAdvertType,
  })
  readonly type!: JournalAdvertType

  @ApiProperty({
    description: 'Subject of the advert, always dependant on the `type`.',
    example: 'fyrir hundahald í Reykjavíkurborg.',
    required: false,
    type: String,
  })
  readonly subject!: string

  @ApiProperty({
    description: 'Title of the advert with both `type` and `subject`.',
    example: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    enum: JournalAdvertStatus,
    description: 'Status of the advert',
    required: true,
    nullable: false,
    type: JournalAdvertStatus,
    example: 'Virk',
  })
  readonly status!: JournalAdvertStatus

  @ApiProperty({
    description: 'Publication number of the advert',
    required: true,
    nullable: true,
    type: JournalAdvertPublicationNumber,
  })
  readonly publicationNumber!: JournalAdvertPublicationNumber

  @ApiProperty({
    description:
      'Date the advert was created. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: false,
    type: String,
    example: '2024-01-01T09:00:00Z',
  })
  readonly createdDate!: string

  @ApiProperty({
    description:
      'Date the advert was last updated. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: false,
    type: String,
    example: '2024-01-20T09:00:00Z',
  })
  readonly updatedDate!: string

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    type: String,
    example: '2024-01-10T16:00:00Z',
  })
  readonly signatureDate!: string | null

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    type: String,
    example: '2024-01-20T09:00:00Z',
  })
  readonly publicationDate!: string | null

  @ApiProperty({
    description: 'List of advert categories.',
    required: true,
    nullable: false,
    type: [JournalAdvertCategory],
  })
  readonly categories!: JournalAdvertCategory[]

  @ApiProperty({
    description: 'Involved party for the advert.',
    required: true,
    nullable: false,
    type: JournalInvolvedParty,
  })
  readonly involvedParty!: JournalInvolvedParty

  @ApiProperty({
    description: 'Advert document in different formats.',
    required: true,
    nullable: false,
    type: JournalDocument,
  })
  readonly document!: JournalDocument
}
