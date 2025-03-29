import { IsEnum } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertTemplateTypeEnums } from '../../../../../../libs/official-journal/modules/advert/src/lib/dto/advert-types.dto'

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
  @IsEnum(AdvertTemplateTypeEnums)
  readonly type!: AdvertTemplateTypeEnums
}

export class AdvertTemplateDetails {
  @ApiProperty({
    required: true,
    example: 'auglysing',
    enum: AdvertTemplateTypeEnums,
  })
  @IsEnum(AdvertTemplateTypeEnums)
  readonly slug!: AdvertTemplateTypeEnums

  @ApiProperty({
    description: 'Template title',
    required: true,
    example: 'Auglýsing',
  })
  readonly title!: string
}
