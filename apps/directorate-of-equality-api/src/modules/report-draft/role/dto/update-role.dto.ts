import { ApiString } from '@dmr.is/decorators'

/** Body for renaming an employee role on a draft. */
export class UpdateRoleDto {
  @ApiString({ minLength: 1, description: 'Role/job title.' })
  title!: string
}
