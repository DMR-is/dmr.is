import { ApiProperty } from '@nestjs/swagger'

import { CaseDetailAdvertMainType } from './case-detail-advert-maintype.dto'

export class CaseDetailAdvertType {
  @ApiProperty({
    type: 'string',
    description: 'The id of the advert type',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: 'string',
    description: 'The title of the advert type',
    required: true,
  })
  title!: string

  @ApiProperty({
    type: 'string',
    description: 'The slug of the advert type',
    required: true,
  })
  slug!: string

  @ApiProperty({
    type: CaseDetailAdvertMainType,
    description: 'The main type of the advert type',
    required: false,
  })
  mainType?: CaseDetailAdvertMainType
}
