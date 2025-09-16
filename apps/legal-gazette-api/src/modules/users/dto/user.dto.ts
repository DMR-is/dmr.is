//   attributes: ['id', 'nationalId', 'firstName', 'lastName', 'email', 'phone'],

import { IsEmail, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UserDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  nationalId!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  phone?: string | null
}

export class GetUsersResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]
}
