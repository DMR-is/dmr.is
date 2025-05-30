import { IsDateString, IsString, IsUUID, ValidateIf } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DetailedDto } from '@dmr.is/legal-gazette/dto'

import { AdvertVersion } from '../advert.model'

export class AdvertDto extends DetailedDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  caseId!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  publicationNumber!: string

  @ApiProperty({
    type: String,
  })
  @IsDateString()
  scheduledAt!: string

  @ApiProperty({
    type: String,
    nullable: true,
  })
  @ValidateIf((o) => o.publishedAt !== null)
  @IsDateString()
  publishedAt!: string | null

  @ApiProperty({
    enum: AdvertVersion,
    enumName: 'AdvertVersion',
  })
  version!: AdvertVersion

  @ApiProperty({
    type: String,
  })
  @IsString()
  html!: string
}

export class GetAdvertsDto {
  @ApiProperty({
    type: [AdvertDto],
  })
  adverts!: AdvertDto[]
}
