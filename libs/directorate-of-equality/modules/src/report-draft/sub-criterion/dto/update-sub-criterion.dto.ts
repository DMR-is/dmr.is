import { ApiOptionalNumber, ApiOptionalString } from '@dmr.is/decorators'

/** Patch body for a sub-criterion (PATCH semantics — omitted keys untouched). */
export class UpdateSubCriterionDto {
  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalString()
  description?: string

  @ApiOptionalNumber()
  weight?: number
}
