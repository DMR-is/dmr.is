import { ApiArray, ApiString } from '@dmr.is/decorators'

import { ReportEmployeeDto } from '../../../report-employee/dto/report-employee.dto'

/**
 * A draft employee with its personal step assignments and role title inlined —
 * the aggregate form of `ReportEmployeeDto` + `GET …/draft/employees/:employeeId/steps`,
 * so the portal does not fan out one request per row to learn the assignments.
 *
 * `roleTitle` is resolved on read from `reportEmployeeRoleId` (a NOT NULL FK),
 * so it cannot go stale. The step *ids* are deliberately not expanded into step
 * objects: a step is only meaningful under its sub-criterion, so any screen
 * rendering step text needs the criteria tree loaded anyway, and embedding
 * would duplicate that bounded vocabulary across every employee row.
 */
export class DraftEmployeeWithStepsDto extends ReportEmployeeDto {
  @ApiString({
    description:
      'Title of the role this employee is assigned to, resolved from `reportEmployeeRoleId`. Saves joining against the roles list to label a row.',
  })
  roleTitle!: string

  @ApiArray({
    type: [String],
    description:
      'Ids of the personal (employee-specific) scoring steps assigned to this employee. Empty when the employee is scored purely through its role.',
  })
  stepIds!: string[]
}
