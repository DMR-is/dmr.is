import { ApiProperty } from '@nestjs/swagger'
import { UserRoleDto } from './user-role.dto'
import { Institution } from './institution.dto'

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
    type: String,
  })
  createdAt!: string

  @ApiProperty({
    type: String,
  })
  updatedAt!: string

  @ApiProperty({
    type: String,
    nullable: true,
  })
  deletedAt!: string | null

  @ApiProperty({
    type: UserRoleDto,
  })
  role!: UserRoleDto
}
