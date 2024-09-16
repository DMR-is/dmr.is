import { IsEmail, IsPhoneNumber } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateCaseChannelBody {
  @ApiProperty({
    type: String,
    example: 'test@test.is',
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    type: String,
    example: '555 5555',
  })
  @IsPhoneNumber('IS')
  phone!: string
}
