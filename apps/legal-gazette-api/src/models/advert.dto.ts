// These DTOs live outside `advert.model.ts` on purpose.
//
// `@ApiDto(StatusDto)` reads its argument eagerly, at class-decoration time,
// and so does `@ApiDtoArray(CommentDto)` - a decorator call evaluates its
// argument like any other function call, and the `() => classRef` it stores
// internally only defers dereferencing a parameter that is already bound.
// `settlement`, `signature`, `status`, `communicationChannels`, `publications`
// and `comments` all name a model that imports `AdvertModel` back at value
// level, so declaring them inside `advert.model.ts` put those reads inside a
// cycle: `undefined` under tsc (a silently wrong Swagger schema and no
// class-transformer nesting), a TDZ `ReferenceError` under swc. Keeping the
// DTOs in a file that nothing in the cycle imports at value level removes the
// reads from the cycle entirely - see `models.md`.
import { PickType } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { DetailedDto } from '../modules/shared/dto/detailed.dto'
import { AdvertTemplateType } from './advert.model'
import { AdvertPublicationDto } from './advert-publication.model'
import { CategoryDto } from './category.model'
import { CommentDto } from './comment.dto'
import { CommunicationChannelDto } from './communication-channel.model'
import { CourtDistrictDto } from './court-district.model'
import { SettlementDto } from './settlement.model'
import { SignatureDto } from './signature.model'
import { StatusDto } from './status.model'
import { TypeDto } from './type.model'
import { UserDto } from './users.model'

export class AdvertDetailedDto extends DetailedDto {
  @ApiUUId()
  id!: string

  @ApiEnum(AdvertTemplateType, { enumName: 'AdvertTemplateType' })
  templateType!: AdvertTemplateType

  @ApiOptionalUuid()
  caseId?: string

  @ApiString()
  title!: string

  @ApiString()
  createdBy!: string

  @ApiString()
  createdByNationalId!: string

  @ApiOptionalString()
  caption?: string

  @ApiOptionalString()
  content?: string

  @ApiOptionalString()
  publicationNumber?: string

  @ApiOptionalString()
  additionalText?: string

  @ApiOptionalDateTime()
  judgementDate?: Date

  @ApiOptionalDateTime()
  divisionMeetingDate?: Date

  @ApiOptionalString()
  divisionMeetingLocation?: string

  @ApiBoolean()
  canEdit!: boolean

  @ApiBoolean()
  canPublish!: boolean

  @ApiBoolean()
  isAssignedToMe!: boolean

  @ApiOptionalDto(CourtDistrictDto)
  courtDistrict?: CourtDistrictDto

  @ApiOptionalDto(SettlementDto)
  settlement?: SettlementDto

  @ApiDtoArray(CommunicationChannelDto)
  communicationChannels!: CommunicationChannelDto[]

  @ApiDtoArray(AdvertPublicationDto)
  publications!: AdvertPublicationDto[]

  @ApiDto(CategoryDto)
  category!: CategoryDto

  @ApiDto(TypeDto)
  type!: TypeDto

  @ApiDto(StatusDto)
  status!: StatusDto

  @ApiOptionalDateTime()
  scheduledAt!: Date | null

  @ApiOptionalDateTime()
  lastPublishedAt!: Date | null

  @ApiOptionalDto(UserDto)
  assignedUser?: UserDto

  @ApiBoolean()
  hasInternalComments!: boolean

  @ApiDtoArray(CommentDto)
  comments!: CommentDto[]

  @ApiOptionalDto(SignatureDto)
  signature?: SignatureDto

  @ApiOptionalDateTime()
  paidAt?: Date

  @ApiOptionalNumber()
  totalPrice?: number

  @ApiNumber()
  estimatedPrice!: number

  @ApiOptionalNumber()
  feeQuantity?: number
}

export class AdvertDto extends PickType(AdvertDetailedDto, [
  'id',
  'title',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'hasInternalComments',
  'category',
  'type',
  'status',
  'scheduledAt',
  'assignedUser',
  'publications',
  'publicationNumber',
] as const) {
  @ApiOptionalDateTime()
  lastPublishedAt!: Date | null
}

export class ExternalAdvertDto extends PickType(AdvertDetailedDto, [
  'id',
  'title',
  'createdAt',
  'updatedAt',
  'createdBy',
  'scheduledAt',
  'caption',
  'content',
  'lastPublishedAt',
] as const) {
  @ApiOptionalString()
  externalId?: string

  @ApiString()
  category!: string

  @ApiString()
  type!: string

  @ApiString()
  status!: string
}
