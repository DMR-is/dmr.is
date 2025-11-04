import { ApiProperty } from '@nestjs/swagger'

export class PersonDto {
  @ApiProperty({ type: String })
  stada!: string
  @ApiProperty({ type: String })
  kennitala!: string
  @ApiProperty({ type: String })
  nafn!: string
  @ApiProperty({ type: String })
  loghHusk!: string
  @ApiProperty({ type: String })
  heimili!: string
  @ApiProperty({ type: String })
  postaritun!: string
  @ApiProperty({ type: String })
  sveitarfelag!: string
  @ApiProperty({ type: String })
  svfNr!: string
  @ApiProperty({ type: Number })
  kynkodi!: number
}

export class GetPersonDto {
  @ApiProperty({ type: PersonDto })
  person!: PersonDto
}
