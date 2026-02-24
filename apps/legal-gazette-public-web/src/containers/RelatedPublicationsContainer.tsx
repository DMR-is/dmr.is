'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SimpleSlider } from '@dmr.is/ui/components/island-is/SimpleSlider/SimpleSlider'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { theme } from '@dmr.is/island-ui-theme'

import { PublicationCard } from '../components/client-components/cards/PublicationCard'
import { AdvertVersionEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useSuspenseQuery } from '@tanstack/react-query'

type Props = {
  publicationNumber: string
  version: AdvertVersionEnum
}

export function RelatedPublicationsContainer({
  publicationNumber,
  version,
}: Props) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.getRelatedPublications.queryOptions({ publicationNumber, version }),
  )

  if (data.publications.length === 0) return null

  const items = data.publications.map((pub) => (
    <PublicationCard key={pub.id} publication={pub} />
  ))

  return (
    <Box background="blue100" padding={[4, 5, 6]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={[3, 4]}>
              <Text variant="h3">Tengdar auglýsingar</Text>
              {data.publications.length === 1 ? (
                <PublicationCard publication={data.publications[0]} />
              ) : (
                <SimpleSlider
                  carouselController
                  items={items}
                  breakpoints={{
                    0: {
                      gutterWidth: theme.grid.gutter.mobile,
                      slideCount: 1,
                    },
                    [theme.breakpoints.sm]: {
                      gutterWidth: theme.grid.gutter.mobile,
                      slideCount: 2,
                    },
                    [theme.breakpoints.md]: {
                      gutterWidth: theme.spacing[3],
                      slideCount: 2,
                    },
                    [theme.breakpoints.lg]: {
                      gutterWidth: theme.spacing[3],
                      slideCount: 2,
                    },
                    [theme.breakpoints.xl]: {
                      gutterWidth: theme.spacing[3],
                      slideCount: 3,
                    },
                  }}
                />
              )}
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
