import { IsEmail, IsOptional } from 'class-validator'

import {
  ApiOptionalBoolean,
  ApiOptionalEnum,
  ApiOptionalString,
} from '@dmr.is/decorators'

import { DoeUserRole } from '../types/user-role'

export class UpdateUserBodyDto {
  @ApiOptionalString()
  firstName?: string

  @ApiOptionalString()
  lastName?: string

  @ApiOptionalString()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiOptionalString({ nullable: true })
  phone?: string | null

  @ApiOptionalBoolean()
  isActive?: boolean

  @ApiOptionalEnum(DoeUserRole)
  role?: DoeUserRole
}
