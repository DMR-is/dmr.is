import type { inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from './server/routers/_app'

type RouterOutputs = inferRouterOutputs<AppRouter>

export type PublicationDetails = RouterOutputs['getPublicationByNumberAndVersion']

type PublicationsResult = RouterOutputs['getPublications']
type RelatedPublicationsResult = RouterOutputs['getRelatedPublications']

export type PublicationListItem = PublicationsResult['publications'][number]
export type RelatedPublicationListItem =
  RelatedPublicationsResult['publications'][number]

export type PublicationCardItem =
  | PublicationListItem
  | RelatedPublicationListItem
