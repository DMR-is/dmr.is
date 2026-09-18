import { OmitType, PartialType } from '@nestjs/swagger'

import {
  ApiOptionalDate,
  ApiOptionalDtoArray,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'
import { SettlementType } from '@dmr.is/legal-gazette-schemas'

import { SettlementCompanyDto, SettlementDto } from '../../../models/settlement.model'

export class CreateSettlementDto {
  @ApiOptionalEnum(SettlementType)
  settlementType?: SettlementType

  @ApiString({ maxLength: 255 })
  liquidatorName!: string

  @ApiString({ maxLength: 255 })
  liquidatorLocation!: string

  @ApiOptionalString({ maxLength: 255 })
  recallRequirementStatementLocation?: string

  @ApiOptionalString({ maxLength: 255 })
  recallRequirementStatementType?: string

  @ApiString({ maxLength: 255 })
  name!: string

  @ApiString({ maxLength: 255 })
  nationalId!: string

  @ApiString({ maxLength: 255 })
  address!: string

  @ApiOptionalNumber()
  declaredClaims?: number

  @ApiOptionalDate()
  deadline?: Date

  @ApiOptionalDate()
  dateOfDeath?: Date

  @ApiOptionalDate()
  endingDate?: Date

  @ApiOptionalString({ maxLength: 10 })
  partnerNationalId?: string

  @ApiOptionalString({ maxLength: 255 })
  partnerName?: string

  @ApiOptionalDate()
  partnerDateOfDeath?: Date

  @ApiOptionalDtoArray(SettlementCompanyDto)
  companies?: SettlementCompanyDto[]
}

export class UpdateSettlementDto extends OmitType(PartialType(SettlementDto), [
  'id',
] as const) {}
