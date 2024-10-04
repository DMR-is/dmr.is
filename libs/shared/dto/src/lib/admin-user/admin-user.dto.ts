import { ApiProperty } from '@nestjs/swagger'

import { AdminUserRole } from './admin-user-role.dto'

export class AdminUser {
  @ApiProperty({
    type: String,
  })
  nationalId!: string

  @ApiProperty({
    type: String,
  })
  displayName!: string

  @ApiProperty({
    type: [AdminUserRole],
  })
  roles!: AdminUserRole[]
}
