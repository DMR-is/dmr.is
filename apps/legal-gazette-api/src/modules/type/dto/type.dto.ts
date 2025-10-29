import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsUUID } from 'class-validator'

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

export class GetTypesQueryDto {
  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Filter out unassignable advert types',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  excludeUnassignable?: boolean
}
