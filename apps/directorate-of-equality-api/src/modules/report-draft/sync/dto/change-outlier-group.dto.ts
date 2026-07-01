import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of an outlier group in a sync batch. `name` is required for
 * CREATE. The four explanation fields are all-or-none (validated server-side):
 * provide all four non-empty (explained) or none (not-yet-explained).
 */
export class OutlierGroupChangeDataDto {
  @ApiOptionalString({ minLength: 1 })
  name?: string

  @ApiOptionalString({ nullable: true })
  reason?: string | null

  @ApiOptionalString({ nullable: true })
  action?: string | null

  @ApiOptionalString({ nullable: true })
  signatureName?: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole?: string | null
}

/**
 * One outlier-group mutation in a sync batch. REMOVE fails (409) if any employee
 * is still a member — reassign membership via the employee commands first.
 */
export class ChangeOutlierGroupDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the outlier group.' })
  id?: string

  @ApiOptionalDto(OutlierGroupChangeDataDto)
  data?: OutlierGroupChangeDataDto
}
