import { ApiProperty } from '@nestjs/swagger'

import { AdvertVersionEnum } from '../../advert/advert.model'

export class AdvertPublicationsDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  advertId!: string

  @ApiProperty()
  scheduledAt!: string

  @ApiProperty({ nullable: true })
  publishedAt!: string | null

  @ApiProperty({ enum: AdvertVersionEnum, enumName: 'AdvertVersionEnum' })
  version!: AdvertVersionEnum
}
