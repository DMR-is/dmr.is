import { ApiProperty, PickType } from '@nestjs/swagger'

import { AdvertSignature } from '../advert-signatures/advert-signature.dto'
import { AdvertSignatureBody } from '../advert-signatures/advert-signature-body.dto'
import { AdvertType } from '../advert-type'
import { CaseAddition } from '../cases/case-addition.dto'
import { Category } from '../categories/category.dto'
import { Department } from '../departments/department.dto'
import { Institution } from '../institutions/institution.dto'
import { AdvertAttachment } from './advert-attachment'
import { AdvertStatus } from './advert-constants.dto'
import { AdvertCorrection } from './advert-correction.dto'
import { AdvertDocument } from './advert-document'
import { AdvertPublicationNumber } from './advert-publication-number.dto'

export class Advert {
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
    type: Department,
    example: 'A deild',
  })
  readonly department!: Department | null

  @ApiProperty({
    description: 'Type of the advert.',
    example: 'GJALDSKRÁ',
    required: true,
    type: AdvertType,
  })
  readonly type!: AdvertType | null

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
    enumName: 'AdvertStatus',
    enum: AdvertStatus,
    description: 'Status of the advert',
    required: true,
    nullable: false,
    type: AdvertStatus,
    example: 'Virk',
  })
  readonly status!: AdvertStatus | null

  @ApiProperty({
    description: 'Publication number of the advert',
    required: true,
    nullable: true,
    type: AdvertPublicationNumber,
  })
  readonly publicationNumber!: AdvertPublicationNumber | null

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
    type: [Category],
    nullable: false,
  })
  readonly categories!: Category[]

  @ApiProperty({
    description: 'Involved party for the advert.',
    required: true,
    nullable: false,
    type: Institution,
  })
  readonly involvedParty!: Institution

  @ApiProperty({
    description: 'Advert document in different formats.',
    required: true,
    nullable: false,
    type: AdvertDocument,
  })
  readonly document!: AdvertDocument

  @ApiProperty({
    type: AdvertSignature,
    description: 'Signatures for the advert.',
    required: true,
  })
  readonly signature!: AdvertSignatureBody | null

  @ApiProperty({
    type: [AdvertAttachment],
    description: 'Attachments for the advert.',
    required: true,
  })
  readonly attachments!: AdvertAttachment[]

  @ApiProperty({
    type: [CaseAddition],
    description: 'Additions for the advert.',
    required: false,
  })
  readonly additions?: CaseAddition[]

  @ApiProperty({
    type: [AdvertCorrection],
    description: 'Corrections made to the advert.',
    required: false,
  })
  readonly corrections?: AdvertCorrection[]
}

export class AdvertLean extends PickType(Advert, [
  'id',
  'title',
  'department',
  'type',
  'subject',
  'status',
  'publicationNumber',
  'publicationDate',
  'categories',
] as const) {}

export class CreateAdvert {
  @ApiProperty({
    type: String,
    description: 'The department id the advert is for.',
    required: true,
  })
  departmentId!: string

  @ApiProperty({
    type: String,
    description: 'The type id the advert is for.',
    required: true,
  })
  typeId!: string

  @ApiProperty({
    type: String,
    description: 'The involved party id the advert is for.',
    required: true,
  })
  involvedPartyId!: string

  @ApiProperty({
    type: String,
    description: 'The subject of the advert.',
    required: true,
  })
  subject!: string

  @ApiProperty({
    type: Number,
    description: 'The serial number of the advert.',
    required: true,
  })
  serial!: number

  @ApiProperty({
    type: String,
    description: 'The publication date of the advert.',
    required: true,
  })
  publicationDate!: string

  @ApiProperty({
    type: String,
    description: 'The signature date of the advert.',
    required: true,
  })
  signatureDate!: string

  @ApiProperty({
    type: String,
    description: 'The html contents of the advert',
    required: true,
  })
  content!: string

  @ApiProperty({
    type: String,
    description: 'The pdf url of the advert',
    required: true,
  })
  pdfUrl!: string

  @ApiProperty({
    type: [String],
    description: 'The category ids of the advert',
    required: true,
  })
  categories!: string[]

  @ApiProperty({
    type: String,
    description: 'UUID of the advert',
    required: false,
  })
  advertId?: string
}
