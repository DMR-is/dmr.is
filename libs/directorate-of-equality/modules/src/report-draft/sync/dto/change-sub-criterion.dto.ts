import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of a sub-criterion in a sync batch. `criterionId` (the parent)
 * is required for CREATE; title/description/weight are required for CREATE
 * (validated server-side).
 */
export class SubCriterionChangeDataDto {
  @ApiOptionalUUID({
    description: 'Id of the parent criterion on the same draft (CREATE).',
  })
  criterionId?: string

  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalString()
  description?: string

  @ApiOptionalNumber({ description: 'Relative weight of this sub-criterion.' })
  weight?: number
}

/**
 * One sub-criterion mutation in a sync batch. REMOVE cascades its steps and the
 * assignments pointing at them.
 */
export class ChangeSubCriterionDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the sub-criterion.' })
  id?: string

  @ApiOptionalDto(SubCriterionChangeDataDto)
  data?: SubCriterionChangeDataDto
}
