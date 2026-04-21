import { ApiString, ApiUUId } from '@dmr.is/decorators'

export class ReportEmployeeRoleDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string
}
