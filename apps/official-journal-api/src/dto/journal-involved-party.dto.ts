import { ApiProperty } from '@nestjs/swagger'

export class JournalInvolvedParty {
  @ApiProperty({
    description: 'Unique ID for the involved party, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Name of the involved party.',
    example: 'Umhverfis- og skipulagssvið Reykjavíkurborgar',
    required: true,
    nullable: false,
  })
  readonly name!: string
}
