import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { BaseEntityDetailDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class CaseTypeDto extends BaseEntityDto {}

export class CaseTypeDetailedDto extends BaseEntityDetailDto {}

export class GetCaseTypeDto {
  @ApiProperty({ type: CaseTypeDto })
  type!: CaseTypeDto
}

export class GetCaseTypesDto {
  @ApiProperty({ type: [CaseTypeDto] })
  types!: CaseTypeDto[]
}

export class GetCaseTypesDetailedDto {
  @ApiProperty({ type: [CaseTypeDetailedDto] })
  types!: CaseTypeDetailedDto[]
}

export class CreateCaseTypeDto extends PickType(CaseTypeDto, ['title']) {}

export class UpdateCaseTypeDto extends PartialType(CreateCaseTypeDto) {}
