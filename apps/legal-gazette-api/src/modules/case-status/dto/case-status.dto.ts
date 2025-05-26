import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetCaseStatusesDto {
  @ApiProperty({
    type: [BaseEntityDto],
  })
  statuses!: BaseEntityDto[]
}

export class GetCasesStatusesDetailedDto {
  @ApiProperty({
    type: [BaseEntityDetailedDto],
  })
  statuses!: BaseEntityDetailedDto[]
}

export class GetCaseStatusDto extends BaseEntityDto {}

export class GetCasesStatusDetailedDto extends BaseEntityDetailedDto {}
