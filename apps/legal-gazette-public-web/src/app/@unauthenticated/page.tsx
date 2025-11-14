import { getServerSession } from 'next-auth'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublicationCard } from '../../components/client-components/cards/PublicationCard'
import { BannerSearch } from '../../components/client-components/front-page/banner-search/BannerSearch'
import { authOptions } from '../../lib/authOptions'
import { trpc } from '../../lib/trpc/client/server'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  return (
    <>
      <p>not Authenticated Home Page</p>
    </>
  )
}
