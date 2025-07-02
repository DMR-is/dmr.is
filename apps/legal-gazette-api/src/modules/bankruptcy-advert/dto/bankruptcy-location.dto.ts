import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class BankruptcyLocationDto {
  @ApiProperty({
    type: String,
    description: 'Name of the bankruptcy location',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'National ID of the bankruptcy location',
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
    description: 'Address of the bankruptcy location',
  })
  @IsString()
  address!: string

  @ApiProperty({
    type: Date,
    description: 'Deadline for the bankruptcy location',
  })
  deadline!: Date
}
