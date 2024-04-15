import { ApiProperty } from '@nestjs/swagger'

import { User } from './user.dto'

export class GetUsersResponse {
  @ApiProperty({
    description: 'List of all active users',
    required: true,
    type: [User],
  })
  readonly users!: Array<User>
}
