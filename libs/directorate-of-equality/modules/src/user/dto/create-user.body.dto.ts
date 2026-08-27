import { IsEmail } from 'class-validator'

import {
  ApiEnum,
  ApiNationalId,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import { DoeUserRole } from '../types/user-role'

export class CreateUserBodyDto {
  @ApiNationalId()
  nationalId!: string

  @ApiString()
  firstName!: string

  @ApiString()
  lastName!: string

  @ApiString()
  @IsEmail()
  email!: string

  @ApiOptionalString({ nullable: true })
  phone?: string | null

  @ApiEnum(DoeUserRole)
  role!: DoeUserRole
}
