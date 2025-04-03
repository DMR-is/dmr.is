import { IsEnum } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
import { AdvertTemplateTypeEnums } from '@dmr.is/constants'

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
