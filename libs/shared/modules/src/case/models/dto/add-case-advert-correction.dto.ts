import { ApiProperty } from '@nestjs/swagger'

export class AddCaseAdvertCorrection {
  @ApiProperty({
    type: String,
    description: 'Title of the correction',
    required: true,
  })
  readonly title!: string

  @ApiProperty({
    type: String,
    description: 'The correction description',
    required: true,
  })
  readonly description!: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  readonly documentHtml?: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  readonly documentPdfUrl?: string
}

export class DeleteCaseAdvertCorrection {
  @ApiProperty({
    type: String,
    description: 'Id of the correction to delete',
    required: true,
  })
  correctionId!: string
}
