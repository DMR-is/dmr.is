import { ApiProperty } from '@nestjs/swagger'

export class GetNextPublicationNumberResponse {
  @ApiProperty({
    type: Number,
    description: 'Next publication number',
    required: true,
    example: 1,
  })
  publicationNumber!: number
}
