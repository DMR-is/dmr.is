import { ApiArray } from '@dmr.is/decorators'

import { ReportEmployeeDto } from '../../../report-employee/dto/report-employee.dto'

/**
 * A draft employee with its personal step assignments inlined — the aggregate
 * form of `ReportEmployeeDto` + `GET …/draft/employees/:employeeId/steps`, so
 * the portal does not fan out one request per row to learn the assignments.
 */
export class DraftEmployeeWithStepsDto extends ReportEmployeeDto {
  @ApiArray({
    type: [String],
    description:
      'Ids of the personal (employee-specific) scoring steps assigned to this employee. Empty when the employee is scored purely through its role.',
  })
  stepIds!: string[]
}
