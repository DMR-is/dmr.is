import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateCaseChannelBody {
  @ApiProperty({
    type: String,
    example: 'Nafn einstaklings',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    example: 'test@test.is',
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    type: String,
    example: '555 5555',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('IS')
  phone?: string
}
