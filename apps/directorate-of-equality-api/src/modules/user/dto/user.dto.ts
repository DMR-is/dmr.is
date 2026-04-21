import {
  ApiBoolean,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

export class UserDto {
  @ApiUUId()
  id!: string

  @ApiString()
  nationalId!: string

  @ApiString()
  firstName!: string

  @ApiString()
  lastName!: string

  @ApiString()
  email!: string

  @ApiOptionalString({ nullable: true })
  phone!: string | null

  @ApiBoolean()
  isActive!: boolean
}
