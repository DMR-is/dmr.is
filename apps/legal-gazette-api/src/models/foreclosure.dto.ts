// `ForeclosureDto` lives outside `foreclosure.model.ts` on purpose.
//
// `@ApiDtoArray(ForeclosurePropertyDto)` reads its argument eagerly - a
// decorator call evaluates its argument like any other function call, and the
// `() => classRef` the decorator stores internally only defers dereferencing a
// parameter that is already bound. `foreclosure-property.model.ts` imports
// `foreclosure.model.ts` back, so declaring the DTO in the model file put that
// read inside a cycle: entering the graph via `foreclosure-property.model`
// threw `Cannot access 'ForeclosurePropertyDto' before initialization`.
// See `models.md`.
import {
  ApiDateTime,
  ApiDtoArray,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ForeclosurePropertyDto } from './foreclosure-property.model'

export class ForeclosureDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  advertId!: string

  @ApiOptionalString({ nullable: true })
  caseNumberIdentifier!: string | null

  @ApiString()
  foreclosureRegion!: string

  @ApiString()
  foreclosureAddress!: string

  @ApiDateTime()
  foreclosureDate!: Date

  @ApiDateTime()
  createdAt!: Date

  @ApiDateTime()
  updatedAt!: Date

  @ApiDtoArray(ForeclosurePropertyDto)
  properties!: ForeclosurePropertyDto[]
}
