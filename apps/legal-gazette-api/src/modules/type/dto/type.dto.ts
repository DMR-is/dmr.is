import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'
import { TypeEnum } from '../type.model'

export class TypeDto extends BaseEntityDto {
  @ApiProperty({
    enum: TypeEnum,
    enumName: 'TypeEnum',
    'x-enumNames': ['Common', 'Recall', 'DivisionMeeting', 'DivisionEnding'],
  })
  title!: TypeEnum
}

export class GetTypesDto {
  @ApiProperty({ type: [TypeDto] })
  types!: TypeDto[]
}
