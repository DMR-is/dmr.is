import { ApiProperty, ApiResponse } from '@nestjs/swagger'

import { AdvertTemplateTypeEnums } from './advert-types.dto'

export class GetAdvertTemplateResponse {
  @ApiProperty({
    description: 'Advert template as HTML',
    required: true,
    type: String,
  })
  readonly html!: string

  @ApiProperty({
    description: 'Template type',
    required: true,
    example: 'auglysing',
    enum: AdvertTemplateTypeEnums,
  })
  readonly type!: string
}

export class GetAdvertTemplatesResponse {
  @ApiProperty({
    required: true,
    example: '["auglysing", "reglugerd", "gjaldskra"]',
    type: [String],
  })
  readonly types!: string[]
}
