import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseCommunicationBody {
  @ApiProperty({
    type: String,
    required: true,
  })
  caseId!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  communicationLookupId!: string

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  reject?: boolean
}
