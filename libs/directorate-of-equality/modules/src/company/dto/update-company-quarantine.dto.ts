import { IsBoolean, IsOptional, IsString } from 'class-validator'

import { ApiBoolean, ApiOptionalString } from '@dmr.is/decorators'

export class UpdateCompanyQuarantineDto {
  @ApiBoolean({
    description:
      'Whether the company is quarantined (all outbound activity halted). `true` quarantines it, `false` lifts it.',
  })
  @IsBoolean()
  quarantined!: boolean

  @ApiOptionalString({
    nullable: true,
    description:
      'Optional reason for quarantining/lifting, kept on the company timeline for later audit.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null
}
