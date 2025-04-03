import { ApiProperty } from '@nestjs/swagger'
import { UserRoleEnum } from '@dmr.is/constants'
import { BaseEntity } from '@dmr.is/shared/dto'
import { InstitutionDto } from '../institution/institution.dto'

export class UserRoleDto extends BaseEntity<UserRoleEnum> {}

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
    type: [InstitutionDto],
  })
  involvedParties!: InstitutionDto[]

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
