import { ApiProperty } from '@nestjs/swagger'

export class UpdateFasttrackBody {
  @ApiProperty({
    type: Boolean,
  })
  fasttrack!: boolean
}
