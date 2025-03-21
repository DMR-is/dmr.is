import { BaseEntityDetailDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'
import { ApiProperty } from '@nestjs/swagger'

export class CaseTypeDto extends BaseEntityDto {}

export class CaseTypeDetailedDto extends BaseEntityDetailDto {}

export class GetCaseTypesDto {
  @ApiProperty({ type: [CaseTypeDto] })
  types!: CaseTypeDto[]
}

export class GetCaseTypesDetailedDto {
  @ApiProperty({ type: [CaseTypeDetailedDto] })
  types!: CaseTypeDetailedDto[]
}
