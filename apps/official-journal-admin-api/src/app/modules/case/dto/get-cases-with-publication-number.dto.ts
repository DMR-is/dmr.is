import { PickType } from '@nestjs/swagger'

import { GetCasesQuery } from './get-cases-query.dto'
import { GetCasesReponse } from './get-cases-response'

/**
 * User sends in a list of case ids and gets back the cases with the publication number
 */
export class GetCasesWithPublicationNumberQuery extends PickType(
  GetCasesQuery,
  ['id'] as const,
) {}

export class GetCasesWithPublicationNumber extends PickType(GetCasesReponse, [
  'cases',
] as const) {}
