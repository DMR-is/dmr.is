import { ApiProperty } from '@nestjs/swagger'

import { AdvertVersionEnum } from '../../advert/advert.model'

export class AdvertPublicationDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  advertId!: string

  @ApiProperty()
  scheduledAt!: string

  @ApiProperty({ type: String, nullable: true })
  publishedAt!: string | null

  @ApiProperty({ enum: AdvertVersionEnum, enumName: 'AdvertVersionEnum' })
  version!: AdvertVersionEnum
}
