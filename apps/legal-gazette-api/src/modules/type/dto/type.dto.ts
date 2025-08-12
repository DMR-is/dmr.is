import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'
import { TypeEnum } from '../type.model'

export class TypeDto extends BaseEntityDto {
  @ApiProperty({
    enum: TypeEnum,
    enumName: 'TypeEnum',
    'x-enumNames': [
      'CommonAdvert',
      'BankruptcyAdvert',
      'BankruptcyDivisionAdvert',
      'DeceasedAdvert',
    ],
  })
  title!: TypeEnum
}

export class GetTypesDto {
  @ApiProperty({ type: [TypeDto] })
  types!: TypeDto[]
}
