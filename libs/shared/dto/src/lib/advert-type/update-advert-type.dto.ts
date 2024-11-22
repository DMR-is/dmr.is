import { ApiProperty } from '@nestjs/swagger'

export class UpdateAdvertTypeBody {
  @ApiProperty({
    type: String,
    description: 'New title of the advert type',
    required: true,
  })
  title!: string
}
