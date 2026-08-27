import { ApiOptionalUUID } from '@dmr.is/decorators'

/** An employee's current outlier-group membership (null = not assigned). */
export class EmployeeOutlierGroupDto {
  @ApiOptionalUUID({ nullable: true })
  groupId!: string | null
}
