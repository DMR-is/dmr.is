import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseStatusBody {
  @ApiProperty({
    type: String,
    description: 'Case status',
    required: true,
    example: 'ready',
  })
  status!: string
}
