import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'
import { ApiProperty } from '@nestjs/swagger'

export class CaseTypeDto extends BaseEntityDto {}

export class GetCaseTypesDto {
  @ApiProperty({ type: [CaseTypeDto] })
  types!: CaseTypeDto[]
}
