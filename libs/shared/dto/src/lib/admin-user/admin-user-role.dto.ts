import { ApiProperty } from '@nestjs/swagger'

export class AdminUserRole {
  @ApiProperty({
    type: String,
  })
  id!: string

  @ApiProperty({
    type: String,
  })
  title!: string

  @ApiProperty({
    type: String,
  })
  slug!: string
}
