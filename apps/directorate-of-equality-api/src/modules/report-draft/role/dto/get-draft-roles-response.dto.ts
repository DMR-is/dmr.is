import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportEmployeeRoleDto } from '../../../report-employee/dto/report-employee-role.dto'

/** The employee roles defined on a draft (small, unpaginated set). */
export class GetDraftRolesResponseDto {
  @ApiDtoArray(ReportEmployeeRoleDto)
  roles!: ReportEmployeeRoleDto[]
}
