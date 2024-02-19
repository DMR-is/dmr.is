import { ApiProperty } from '@nestjs/swagger'

export class JournalSignatureMember {
  @ApiProperty({
    description: 'Name of the committee chairman',
    example: 'Dagur B. Eggertsson',
    required: true,
    type: String,
  })
  name!: string

  @ApiProperty({
    description: 'Text above the name of the signature',
    example: 'borgarstjóri',
    required: false,
    type: String,
  })
  textBelow!: string | null
}
