import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { ApiOptionalString } from '@dmr.is/decorators'
import { Paging, PagingQuery } from '@dmr.is/shared-dto'

import { TBRCompanySettingsItemDto } from '../../../../models/tbr-company-settings.model'

export class GetTBRCompanySettingsQueryDto extends PagingQuery {
  @ApiOptionalString()
  search?: string

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean
}
export class TBRCompanySettingsListDto {
  @ApiProperty({ type: [TBRCompanySettingsItemDto] })
  items!: TBRCompanySettingsItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateTBRCompanySettingsDto extends PickType(
  TBRCompanySettingsItemDto,
  ['name', 'nationalId', 'email', 'phone'],
) {}

export class UpdateTbrCompanySettingsDto extends PartialType(
  CreateTBRCompanySettingsDto,
) {}
