import { Type } from 'class-transformer'
import { IsArray, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiString } from '@dmr.is/decorators'
import { Paging, PagingQuery } from '@dmr.is/shared-dto'

import { CaseDto } from '../../../models/case.model'

export class CaseQueryDto extends PagingQuery {}

export class CreateCaseDto {
  @ApiString()
  involvedPartyNationalId!: string
}

export class GetCasesDto {
  @ApiProperty({ type: [CaseDto] })
  @IsArray()
  @Type(() => CaseDto)
  @ValidateNested({ each: true })
  cases!: CaseDto[]

  @ApiProperty({ type: Paging })
  @Type(() => Paging)
  @ValidateNested()
  paging!: Paging
}
