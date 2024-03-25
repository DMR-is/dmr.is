import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class CaseInstitution {
  @ApiProperty({
    type: String,
    description: 'SSN of the institution',
  })
  // @IsKennitala()
  ssn!: string

  @ApiProperty({
    type: String,
    description: 'Name of the institution',
  })
  @IsString()
  @Length(1)
  name!: string
}
