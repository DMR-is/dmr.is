import { UserRoleEnum } from '@dmr.is/constants'

import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'

import { Institution } from '../institutions'
import { Paging, PagingQuery } from '../paging'
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
    type: [Institution],
  })
  involvedParties!: Institution[]

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

  @ApiProperty({
    type: Paging,
  })
  paging!: Paging
}

export class GetInvoledPartiesByUserResponse {
  @ApiProperty({
    type: [Institution],
  })
  involvedParties!: Institution[]
}

export class CreateUserDto extends PickType(UserDto, [
  'nationalId',
  'firstName',
  'lastName',
  'email',
] as const) {
  @ApiProperty({
    type: String,
  })
  roleId!: string

  @ApiProperty({
    type: [String],
    required: false,
  })
  involvedParties?: string[]

  @ApiProperty({
    type: String,
    required: false,
  })
  displayName?: string
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['roleId', 'nationalId'] as const),
) {}

export class GetUsersQuery extends PagingQuery {
  @ApiProperty({
    type: String,
    required: false,
  })
  search?: string

  @ApiProperty({
    type: String,
    description: 'Slug of the institution',
    required: false,
  })
  involvedParty?: string

  @ApiProperty({
    type: String,
    description: 'Slug of the role',
    required: false,
  })
  role?: string
}
