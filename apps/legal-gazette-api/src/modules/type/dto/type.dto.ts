import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'

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
