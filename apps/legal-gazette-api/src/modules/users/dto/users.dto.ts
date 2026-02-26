import { IsEmail, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiOptionalString, ApiString } from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import { UserDto } from '../../../models/users.model'

export class GetUsersResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]
}

export class GetUsersWithPagingResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateUserDto {
  @ApiString()
  nationalId!: string

  @ApiProperty({ type: String })
  @IsEmail()
  email!: string

  @ApiOptionalString()
  phone?: string
}

export class UpdateUserDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiOptionalString()
  phone?: string
}
