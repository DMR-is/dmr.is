import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
} from '@dmr.is/decorators'
import { Paging, PagingQuery } from '@dmr.is/shared-dto'

import { AdvertDto } from '../../../../models/advert.model'
import {
  AdvertPublicationDto,
  AdvertVersionEnum,
  PublishedPublicationDto,
} from '../../../../models/advert-publication.model'

export class AdvertPublicationDetailedDto {
  @ApiProperty({ type: () => AdvertPublicationDto })
  publication!: AdvertPublicationDto

  @ApiProperty({ type: () => AdvertDto })
  advert!: AdvertDto

  @ApiProperty({ type: String })
  html!: string
}

export class UpdateAdvertPublicationDto {
  @ApiDateTime()
  scheduledAt!: Date
}

export class GetPublicationsDto {
  @ApiProperty({ type: [PublishedPublicationDto] })
  publications!: PublishedPublicationDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class GetCombinedHTMLDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  publicationsHtml!: string[]
}

export class GetRelatedPublicationsDto extends PickType(GetPublicationsDto, [
  'publications',
] as const) {}

export class GetPublicationsQueryDto extends PagingQuery {
  @ApiOptionalUuid()
  advertId?: string

  @ApiOptionalString()
  search?: string

  @ApiOptionalDateTime()
  dateFrom?: Date

  @ApiOptionalDateTime()
  dateTo?: Date

  @ApiOptionalUuid()
  typeId?: string

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryId?: string[]

  @ApiOptionalString()
  pdfUrl?: string

  @ApiOptionalEnum(AdvertVersionEnum, {
    enumName: 'AdvertVersionEnum',
  })
  version?: AdvertVersionEnum
}
