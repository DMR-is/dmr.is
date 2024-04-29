import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationBody {
  @ApiProperty({
    description: 'Application id',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly applicationId!: string
}
