import { ApiProperty } from '@nestjs/swagger'

export class PostCasePublishBody {
  @ApiProperty({
    type: [String],
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Id of the case to publish.',
  })
  readonly caseIds!: string[]
}
