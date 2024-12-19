import { IsEnum } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export enum AdvertTemplateTypeEnums {
  AUGLYSING = 'auglysing',
  REGLUGERD = 'reglugerd',
  GJALDSKRA = 'gjaldskra',
}

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
