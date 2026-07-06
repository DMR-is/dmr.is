import { ApiUUId } from '@dmr.is/decorators'

/** Body for assigning a detected-outlier employee to an outlier group. */
export class SetEmployeeOutlierGroupDto {
  @ApiUUId({ description: 'Id of an outlier group on the same draft.' })
  groupId!: string
}
