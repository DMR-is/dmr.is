import { IsEnum } from 'class-validator'

import { ApiEnum } from '@dmr.is/decorators'

import { CompanySectorEnum } from '../models/company.enums'

export class UpdateCompanySectorDto {
  @ApiEnum(CompanySectorEnum, {
    enumName: 'CompanySectorEnum',
    description:
      'The ownership sector to set. PRIVATE or PUBLIC marks the classification as admin-owned (`sectorOverride = true`), so a backfill will not overwrite it. UNKNOWN clears the override and hands the company back to automatic RSK classification.',
  })
  @IsEnum(CompanySectorEnum)
  sector!: CompanySectorEnum
}
