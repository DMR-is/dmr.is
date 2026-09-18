import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import { ReportEmployeeDto } from '../../../report-employee/dto/report-employee.dto'

/** Paginated list of a draft's employees (a report can carry thousands). */
export class GetDraftEmployeesResponseDto {
  @ApiProperty({ type: [ReportEmployeeDto] })
  employees!: ReportEmployeeDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}
