import { ApiProperty } from '@nestjs/swagger'

import { AdminUserRole } from './admin-user-role.dto'

export class AdminUser {
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
    type: [AdminUserRole],
  })
  roles!: AdminUserRole[]
}

export class GetAdminUser {
  @ApiProperty({
    type: AdminUser,
  })
  user!: AdminUser
}

export class GetAdminUsers {
  @ApiProperty({
    type: [AdminUser],
  })
  users!: AdminUser[]
}
