import { ApiArray } from '@dmr.is/decorators'

import { ReportEmployeeRoleDto } from '../../../report-employee/dto/report-employee-role.dto'

/**
 * A draft role with its assigned step ids inlined — the aggregate form of
 * `ReportEmployeeRoleDto` + `GET …/draft/roles/:roleId/steps`.
 */
export class DraftRoleWithStepsDto extends ReportEmployeeRoleDto {
  @ApiArray({
    type: [String],
    description:
      'Ids of the scoring steps assigned to this role. Empty when the role has not been scored yet.',
  })
  stepIds!: string[]
}
