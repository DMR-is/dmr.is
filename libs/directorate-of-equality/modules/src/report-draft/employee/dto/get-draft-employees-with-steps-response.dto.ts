import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { DraftEmployeeWithStepsDto } from './draft-employee-with-steps.dto'

/**
 * Paginated list of a draft's employees with their personal step assignments.
 * Paged like the plain employee list — a report can carry up to `MAX_EMPLOYEES`
 * rows, so the joined form is not published unpaginated.
 */
export class GetDraftEmployeesWithStepsResponseDto {
  @ApiProperty({ type: [DraftEmployeeWithStepsDto] })
  employees!: DraftEmployeeWithStepsDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
