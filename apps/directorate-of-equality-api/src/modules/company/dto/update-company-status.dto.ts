import { IsEnum, IsOptional, IsString } from 'class-validator'

import { ApiEnum, ApiOptionalString } from '@dmr.is/decorators'

import { CompanyStatusEnum } from '../models/company.enums'

export class UpdateCompanyStatusDto {
  @ApiEnum(CompanyStatusEnum, { enumName: 'CompanyStatusEnum' })
  @IsEnum(CompanyStatusEnum)
  status!: CompanyStatusEnum

  @ApiOptionalString({
    nullable: true,
    description: 'Optional reason for the change, e.g. bankruptcy or merger.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null
}
