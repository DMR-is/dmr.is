import { UserRoleEnum } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntity } from '../entity'

export class UserRoleDto extends BaseEntity<UserRoleEnum> {}

export class GetRolesByUserResponse {
  @ApiProperty({
    type: [UserRoleDto],
    description: 'Available roles for the current user to fetch',
  })
  roles!: UserRoleDto[]
}
