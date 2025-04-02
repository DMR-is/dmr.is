import { AdvertType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'
import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertType {
  @ApiProperty({
    type: AdvertType,
    description: 'The advert type',
  })
  type!: AdvertType
}
