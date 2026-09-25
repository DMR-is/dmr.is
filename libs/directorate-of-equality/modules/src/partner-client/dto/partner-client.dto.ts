import {
  ApiArray,
  ApiDateTime,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/** An approved intermediary firm, as the admin back office lists it. */
export class PartnerClientDto {
  @ApiUUId()
  id!: string

  @ApiString({ description: 'The firm’s kennitala.' })
  nationalId!: string

  @ApiString()
  name!: string

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'The ceiling on what the firm may ever do. What it may do for a given company is this intersected with that company’s delegation.',
  })
  scopes!: ApiKeyScopeEnum[]

  @ApiUUId({ description: 'The DoE admin who approved the firm.' })
  createdByUserId!: string

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'Set once the firm is cut off. A revoked firm authenticates nowhere, whatever keys or delegations it still holds.',
  })
  revokedAt!: Date | null

  @ApiOptionalString({ nullable: true })
  revokedByUserId!: string | null

  @ApiOptionalString({ nullable: true })
  revokedReason!: string | null
}
