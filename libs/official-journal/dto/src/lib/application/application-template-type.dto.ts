import { IsEnum } from 'class-validator'
import { AdvertTemplateTypeEnums } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class AdvertTemplateType {
  @IsEnum(AdvertTemplateTypeEnums)
  @ApiProperty({
    description: 'Advert type.',
    example: 'auglysing',
    required: true,
    enum: AdvertTemplateTypeEnums,
  })
  readonly type!: AdvertTemplateTypeEnums
}
