import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { CompanyDto } from './company.dto'

export class GetCompaniesResponseDto {
  @ApiProperty({ type: [CompanyDto] })
  companies!: CompanyDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
