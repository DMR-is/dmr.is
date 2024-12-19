import { ApiProperty } from '@nestjs/swagger'

export class CreateAdminUser {
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
  displayName!: string

  @ApiProperty({
    type: String,
  })
  email!: string

  @ApiProperty({
    type: [String],
  })
  roleIds!: string[]
}
