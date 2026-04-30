import { IsNotEmpty, IsString } from 'class-validator'

import {
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

export class ConfigDto {
  @ApiUUId()
  id!: string

  @ApiString()
  key!: string

  @ApiString()
  value!: string

  @ApiOptionalString({ nullable: true })
  description!: string | null

  @ApiOptionalDateTime({ nullable: true })
  supersededAt!: Date | null
}

export class UpdateConfigDto {
  @ApiString()
  @IsString()
  @IsNotEmpty()
  value!: string

  @ApiOptionalString({ nullable: true })
  description?: string | null
}
