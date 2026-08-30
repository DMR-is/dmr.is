import {
  ApiEnum,
  ApiOptionalDto,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of an outlier group in a sync batch. `name` is required for
 * CREATE. The five explanation fields are all-or-none (validated server-side):
 * provide all five, with the four texts non-empty (explained), or none
 * (not-yet-explained).
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

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2027-03-01',
    description:
      'Date the company commits to having this group’s improvements completed by ("Dagsetning úrbóta"), as `YYYY-MM-DD`. Must be in the future and no more than three years out.',
  })
  remedyDate?: string | null
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
