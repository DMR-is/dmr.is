import { UserRoleEnum } from '@dmr.is/constants'
import { BaseEntity } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

export class UserRoleDto extends BaseEntity<UserRoleEnum> {}

export class GetRolesByUserResponse {
  @ApiProperty({
    type: [UserRoleDto],
    description: 'Available roles for the current user to fetch',
  })
  roles!: UserRoleDto[]
}
