import { ApiOptionalDtoArray } from '@dmr.is/decorators'

import { ChangeCriterionDto } from './change-criterion.dto'
import { ChangeEmployeeDto } from './change-employee.dto'
import { ChangeOutlierGroupDto } from './change-outlier-group.dto'
import { ChangeRoleDto } from './change-role.dto'
import { ChangeStepDto } from './change-step.dto'
import { ChangeSubCriterionDto } from './change-sub-criterion.dto'

/**
 * Bulk-sync body for a DRAFT report. Per-collection arrays of tagged commands
 * (`{ method, id, data }`), applied atomically in one transaction. An omitted
 * collection is left untouched; an empty array is a no-op (never "delete all").
 *
 * Ids are client-minted UUIDs, so a command can reference a sibling created in
 * the same batch (e.g. an employee assigned to a just-created role). The server
 * applies collections in dependency order: criteria → sub-criteria → steps →
 * roles → employees → outlier groups, then removals, then outlier-group
 * membership (after detection). Any failure rolls the whole batch back.
 */
export class SyncDraftDto {
  @ApiOptionalDtoArray(ChangeCriterionDto)
  criteria?: ChangeCriterionDto[]

  @ApiOptionalDtoArray(ChangeSubCriterionDto)
  subCriteria?: ChangeSubCriterionDto[]

  @ApiOptionalDtoArray(ChangeStepDto)
  steps?: ChangeStepDto[]

  @ApiOptionalDtoArray(ChangeRoleDto)
  roles?: ChangeRoleDto[]

  @ApiOptionalDtoArray(ChangeEmployeeDto)
  employees?: ChangeEmployeeDto[]

  @ApiOptionalDtoArray(ChangeOutlierGroupDto)
  outlierGroups?: ChangeOutlierGroupDto[]
}
