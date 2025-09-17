import { ApiProperty } from '@nestjs/swagger'

import { AdvertDto } from '../../advert/dto/advert.dto'
import { AdvertPublicationDto } from './advert-publication.dto'

export class AdvertPublicationDetailedDto {
  @ApiProperty({ type: AdvertPublicationDto })
  publication!: AdvertPublicationDto

  @ApiProperty({ type: AdvertDto })
  advert!: AdvertDto

  @ApiProperty({ type: String })
  html!: string
}
