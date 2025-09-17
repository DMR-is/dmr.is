import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'

export class TypeDto extends BaseEntityDto {
  @ApiProperty({ type: String })
  title!: string
}

export class GetTypesDto {
  @ApiProperty({ type: [TypeDto] })
  types!: TypeDto[]
}
