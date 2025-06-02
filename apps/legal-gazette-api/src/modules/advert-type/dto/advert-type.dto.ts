import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class AdvertTypeDto extends BaseEntityDto {}

export class AdvertTypeDetailedDto extends BaseEntityDetailedDto {}

export class GetAdvertTypeDto {
  @ApiProperty({ type: AdvertTypeDto })
  type!: AdvertTypeDto
}

export class GetAdvertTypesDto {
  @ApiProperty({ type: [AdvertTypeDto] })
  types!: AdvertTypeDto[]
}

export class GetAdvertTypesDetailedDto {
  @ApiProperty({ type: [AdvertTypeDetailedDto] })
  types!: AdvertTypeDetailedDto[]
}

export class CreateAdvertType extends PickType(AdvertTypeDto, ['title']) {}

export class UpdateAdvertType extends PartialType(CreateAdvertType) {}
