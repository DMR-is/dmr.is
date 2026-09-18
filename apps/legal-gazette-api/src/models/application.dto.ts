// These DTOs live outside `application.model.ts` on purpose.
//
// `ApplicationDto.adverts` needs `AdvertDto` at value level, and
// `advert.model.ts` imports `ApplicationModel` back. Declaring these classes
// inside `application.model.ts` therefore made `advert.dto.ts` reachable from
// inside the model cycle - `status.model -> advert.model -> application.model
// -> advert.dto -> status.model` - which is exactly the eager read that
// `advert.dto.ts` exists to avoid. See `models.md`.
import { Type } from 'class-transformer'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiEnum,
  ApiNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'

import { DetailedDto } from '../modules/shared/dto/detailed.dto'
import { AdvertDto } from './advert.dto'
import { ApplicationStatusEnum } from './application.model'

export class ApplicationDto extends DetailedDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  caseId!: string

  @ApiString()
  applicantNationalId!: string

  @ApiOptionalString()
  submittedByNationalId?: string

  @ApiEnum(ApplicationStatusEnum, { enumName: 'ApplicationStatusEnum' })
  status!: ApplicationStatusEnum

  @ApiString()
  title!: string

  @ApiOptionalString()
  subtitle?: string

  @ApiEnum(ApplicationTypeEnum, { enumName: 'ApplicationTypeEnum' })
  type!: ApplicationTypeEnum

  @ApiProperty({
    type: () => AdvertDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => AdvertDto)
  @ValidateNested({ each: true })
  adverts?: AdvertDto[]

  @ApiBoolean()
  canAddAdverts!: boolean

  @ApiNumber()
  currentStep!: number
}

export class ApplicationDetailedDto extends ApplicationDto {
  @ApiProperty({ type: Object, default: {} })
  answers!: Record<string, any>
}
