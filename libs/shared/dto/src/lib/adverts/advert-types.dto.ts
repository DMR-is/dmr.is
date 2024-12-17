import { IsEnum } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export enum AdvertTemplateTypeEnums {
  AUGLYSING = 'AUGLÝSING',
  REGLUGERD = 'REGLUGERÐ',
  GJALDSKRA = 'GJALDSKRÁ',
}

export class AdvertTemplateType {
  @IsEnum(AdvertTemplateTypeEnums)
  @ApiProperty({
    description: 'Advert type.',
    example: 'AUGLÝSING',
    required: true,
    enum: AdvertTemplateTypeEnums,
  })
  readonly type!: AdvertTemplateTypeEnums
}
