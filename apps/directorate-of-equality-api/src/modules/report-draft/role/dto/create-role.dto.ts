import { ApiString } from '@dmr.is/decorators'

/** Body for creating an employee role on a draft. */
export class CreateRoleDto {
  @ApiString({ minLength: 1, description: 'Role/job title.' })
  title!: string
}
