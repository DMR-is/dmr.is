import { IsUUID } from 'class-validator'

import {
  ApiEnum,
  ApiOptionalArray,
  ApiOptionalDto,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of a role in a sync batch. All optional (flat command DTO):
 * `title` is required for CREATE (validated server-side). `stepIds`, when
 * present, REPLACES the role's full step-assignment set (empty array clears).
 */
export class RoleChangeDataDto {
  @ApiOptionalString({ minLength: 1, description: 'Role/job title.' })
  title?: string

  @ApiOptionalArray({
    type: [String],
    description:
      'Full set of step ids assigned to this role (replace-all). Every id must be a step on the same draft.',
  })
  @IsUUID(undefined, { each: true })
  stepIds?: string[]
}

/**
 * One role mutation in a sync batch. `id` is the client-minted UUID (present on
 * all methods); `data` carries the fields for CREATE/UPDATE. CREATE with an
 * existing owned id is an idempotent upsert.
 */
export class ChangeRoleDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the role.' })
  id?: string

  @ApiOptionalDto(RoleChangeDataDto)
  data?: RoleChangeDataDto
}
