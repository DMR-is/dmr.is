import { ApiProperty, PickType } from '@nestjs/swagger'

import { UserRoleDto } from './user-role.dto'

export class UserDto {
  @ApiProperty({
    type: String,
  })
  id!: string

  @ApiProperty({
    type: String,
  })
  nationalId!: string

  @ApiProperty({
    type: String,
  })
  firstName!: string

  @ApiProperty({
    type: String,
  })
  lastName!: string

  @ApiProperty({
    type: String,
  })
  fullName!: string

  @ApiProperty({
    type: String,
  })
  email!: string

  @ApiProperty({
    type: String,
  })
  displayName!: string

  @ApiProperty({
    type: Date,
  })
  createdAt!: Date

  @ApiProperty({
    type: Date,
  })
  updatedAt!: Date

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  deletedAt!: Date | null

  @ApiProperty({
    type: UserRoleDto,
  })
  role!: UserRoleDto
}

export class GetUserResponse {
  @ApiProperty({
    type: UserDto,
  })
  user!: UserDto
}

export class GetUsersResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]
}

export class CreateUserBody extends PickType(UserDto, [
  'nationalId',
  'firstName',
  'lastName',
  'email',
] as const) {
  @ApiProperty({
    type: [String],
  })
  roleIds!: string[]
}

export class GetUsersQuery {
  @ApiProperty({
    type: String,
  })
  search?: string

  @ApiProperty({
    type: [String],
  })
  involvedPartyId?: [string]
}
