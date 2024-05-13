import { ApiProperty } from '@nestjs/swagger'

export class DeleteCaseCommentResponse {
  @ApiProperty({
    description: 'The deleted case comment',
    required: true,
    type: Boolean,
  })
  readonly success!: boolean
}
