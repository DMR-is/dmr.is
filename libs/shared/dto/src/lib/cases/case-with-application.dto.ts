import { Type } from 'class-transformer'
import { IsDateString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from '../advert-types/advert-type.dto'
import { Category } from '../categories/category.dto'
import { Department } from '../departments/department.dto'
import { Institution } from '../institutions/institution.dto'
import { Case } from './case.dto'

class AdvertDocument {
  @ApiProperty({
    type: String,
    description: 'HTML of the advert',
  })
  readonly advert!: string

  @ApiProperty({
    type: String,
    description: 'HTML of the signature',
  })
  readonly signature!: string

  @ApiProperty({
    type: String,
    description: 'HTLM of the full document',
  })
  readonly full!: string
}

class AdvertFields {
  @ApiProperty({
    type: String,
  })
  readonly department!: Department

  @ApiProperty({
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Type of the advert.',
    required: true,
    type: AdvertType,
  })
  readonly type!: AdvertType | null

  @ApiProperty({
    type: AdvertDocument,
    description: 'Advert documents',
  })
  readonly documents!: AdvertDocument

  @ApiProperty({
    type: Institution,
    description: 'Institution the advert is for.',
  })
  readonly institution!: Institution

  @ApiProperty({
    type: [Category],
    description: 'Categories of the advert.',
  })
  readonly categories!: Category[]

  @ApiProperty({
    description:
      'Date the advert was signed, can be null. ISO 8601 date and time format in UTC.',
    required: true,
    nullable: true,
    type: String,
  })
  readonly signatureDate!: string | null

  @ApiProperty({
    type: String,
    description: 'The date the advert requested publication day.',
  })
  @IsDateString()
  readonly publicationDate!: string
}

export class CaseWithAdvert {
  @ApiProperty({
    type: AdvertFields,
    description: 'Advert fields',
  })
  @Type(() => AdvertFields)
  readonly advert!: AdvertFields

  @ApiProperty({
    type: Case,
    description: 'Case fields',
  })
  @Type(() => Case)
  readonly case!: Case
}
