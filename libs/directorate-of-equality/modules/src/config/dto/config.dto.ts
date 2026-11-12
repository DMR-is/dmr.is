import { IsNotEmpty, IsString } from 'class-validator'

import {
  ApiBoolean,
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

/**
 * Whether this environment sends notices to island.is mailboxes at all
 * (`ONESYSTEMS_ENABLED`). Read-only: it is set per environment by the
 * deployment, not by an admin. The allowlist narrows it to named companies.
 */
export class OneSystemsStatusDto {
  @ApiBoolean({
    description:
      'ONESYSTEMS_ENABLED is on for this environment. When off, no company gets mailbox notices whatever the allowlist says.',
  })
  enabled!: boolean
}
