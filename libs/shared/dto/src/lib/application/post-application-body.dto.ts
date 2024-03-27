import { ApiProperty } from '@nestjs/swagger'

import { AdvertSignatureBody } from '../advert-signatures/advert-signature-body.dto'

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
    description: 'Application selected department id',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly department!: string

  @ApiProperty({
    description: 'Application selected type id',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly type!: string

  @ApiProperty({
    description: 'Application selected array of categories ids',
    type: [String],
    example: [
      '00000000-0000-0000-0000-000000000000',
      '11111111-1111-1111-1111-111111111111',
    ],
    required: true,
    nullable: false,
  })
  readonly categories!: string[]

  @ApiProperty({
    description: 'Subject of the submitted application',
    type: String,
    example: 'um hundahald í Reykjavíkurborg',
    required: true,
    nullable: false,
  })
  readonly subject!: string

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
    description:
      "Contents of the advert's document in the submitted application (HTML string)",
    type: String,
    example:
      '<p>GJALDSKRÁ um hundahald í Reykjavík</p><div><p>Dagur B. Eggertsson</p></div>',
    required: true,
    nullable: false,
  })
  readonly document!: string

  @ApiProperty({
    type: AdvertSignatureBody,
    required: true,
    nullable: false,
  })
  readonly signature!: AdvertSignatureBody
}
