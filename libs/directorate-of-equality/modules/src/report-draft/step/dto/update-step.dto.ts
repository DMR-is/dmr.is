import { ApiOptionalNumber, ApiOptionalString } from '@dmr.is/decorators'

/** Patch body for a scoring step (PATCH semantics — omitted keys untouched). */
export class UpdateStepDto {
  @ApiOptionalNumber()
  order?: number

  @ApiOptionalString()
  description?: string

  @ApiOptionalNumber()
  score?: number
}
