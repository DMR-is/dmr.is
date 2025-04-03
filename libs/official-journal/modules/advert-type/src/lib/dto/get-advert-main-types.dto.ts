import { ApiProperty } from '@nestjs/swagger'
import { Paging } from '@dmr.is/shared/dto'
import { AdvertMainType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'

export class GetAdvertMainTypes {
  @ApiProperty({
    type: [AdvertMainType],
    description: 'List of all main advert types',
  })
  mainTypes!: AdvertMainType[]

  @ApiProperty({
    type: Paging,
    description: 'Paging information',
  })
  paging!: Paging
}
