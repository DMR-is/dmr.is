import { IsBoolean, IsOptional, IsString } from 'class-validator'

import { ApiBoolean, ApiOptionalString } from '@dmr.is/decorators'

export class UpdateCompanyFinesDto {
  @ApiBoolean({
    description:
      'Whether the company is in the daily-fines process (handled outside this system). `true` starts it, `false` stops it.',
  })
  @IsBoolean()
  finesStarted!: boolean

  @ApiOptionalString({
    nullable: true,
    description:
      'Optional reason for starting/stopping the fines process, kept on the company timeline for later audit.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null
}
