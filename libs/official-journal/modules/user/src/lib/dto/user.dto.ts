import { ApiProperty, PickType, PartialType, OmitType } from '@nestjs/swagger'
import { UserDto, Institution, UserRoleDto } from '@dmr.is/official-journal/dto'
import { Paging, PagingQuery } from '@dmr.is/shared/dto'

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

export class GetRolesByUserResponse {
  @ApiProperty({
    type: [UserRoleDto],
    description: 'Available roles for the current user to fetch',
  })
  roles!: UserRoleDto[]
}
