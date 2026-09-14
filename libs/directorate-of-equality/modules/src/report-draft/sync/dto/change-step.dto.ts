import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of a scoring step in a sync batch. `subCriterionId` (the
 * parent) is required for CREATE; order/description/score are required for
 * CREATE (validated server-side).
 */
export class StepChangeDataDto {
  @ApiOptionalUUID({
    description: 'Id of the parent sub-criterion on the same draft (CREATE).',
  })
  subCriterionId?: string

  @ApiOptionalNumber({
    description: 'Ordering position of the step within its sub-criterion.',
  })
  order?: number

  @ApiOptionalString()
  description?: string

  @ApiOptionalNumber({ description: 'Score awarded when this step applies.' })
  score?: number
}

/**
 * One scoring-step mutation in a sync batch. REMOVE destroys the join rows
 * pointing at the step, but the classifications they carried are not lost: sync
 * re-homes each one to the nearest surviving step of the same sub-criterion,
 * preferring a lower order. See `syncDraft` and `clampOrphanedAssignments`.
 */
export class ChangeStepDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the step.' })
  id?: string

  @ApiOptionalDto(StepChangeDataDto)
  data?: StepChangeDataDto
}
