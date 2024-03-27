import { ApiProperty } from '@nestjs/swagger'
import { AdvertPublicationNumber } from './advert-publication-number.dto'
import { Category } from '../categories/category.dto'

import { AdvertDocument } from './advert-document'
import { Department } from '../departments/department.dto'
import { AdvertType } from '../advert-types/advert-type.dto'
import { AdvertSignature } from '../advert-signatures/advert-signature.dto'
import { AdvertSignatureBody } from '../advert-signatures/advert-signature-body.dto'
import { Institution } from '../institutions/institution.dto'
import { AdvertStatus } from './advert-constants.dto'

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
  readonly department!: Department

  @ApiProperty({
    description: 'Type of the advert.',
    example: 'GJALDSKRÁ',
    required: true,
    type: AdvertType,
  })
  readonly type!: AdvertType

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
    enum: AdvertStatus,
    description: 'Status of the advert',
    required: true,
    nullable: false,
    type: AdvertStatus,
    example: 'Virk',
  })
  readonly status!: AdvertStatus

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
  readonly involvedParty!: Institution | null

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
}
