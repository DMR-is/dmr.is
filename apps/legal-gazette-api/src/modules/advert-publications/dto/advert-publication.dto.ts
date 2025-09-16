import { IsDateString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { AdvertVersionEnum } from '../../advert/advert.model'
import { AdvertDto } from '../../advert/dto/advert.dto'

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

export class AdvertPublicationDetailedDto {
  @ApiProperty({ type: AdvertPublicationDto })
  publication!: AdvertPublicationDto

  @ApiProperty({ type: AdvertDto })
  advert!: AdvertDto

  @ApiProperty({ type: String })
  html!: string
}

export class UpdateAdvertPublicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string
}
