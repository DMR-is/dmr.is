import { PickType } from '@nestjs/swagger'

import { Advert } from './advert.dto'

export class AdvertSimilar extends PickType(Advert, [
  'id',
  'title',
  'department',
  'subject',
  'categories',
  'publicationDate',
  'publicationNumber',
  'involvedParty',
] as const) {}
