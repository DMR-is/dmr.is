import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../../../report-criterion/models/report-criterion.model'
import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of a top-level criterion in a sync batch. All optional (flat
 * command DTO); title/weight/description/type are required for CREATE
 * (validated server-side).
 */
export class CriterionChangeDataDto {
  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalNumber({ description: 'Relative weight of this criterion.' })
  weight?: number

  @ApiOptionalString()
  description?: string

  @ApiOptionalEnum(ReportCriterionTypeEnum, {
    enumName: 'ReportCriterionTypeEnum',
  })
  type?: ReportCriterionTypeEnum
}

/**
 * One criterion mutation in a sync batch. REMOVE cascades the whole subtree
 * (sub-criteria, steps, and the assignments pointing at those steps).
 */
export class ChangeCriterionDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the criterion.' })
  id?: string

  @ApiOptionalDto(CriterionChangeDataDto)
  data?: CriterionChangeDataDto
}
