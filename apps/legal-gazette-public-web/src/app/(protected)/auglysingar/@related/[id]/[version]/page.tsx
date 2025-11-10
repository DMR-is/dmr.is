import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  SimpleSlider,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { theme } from '@island.is/island-ui/theme'

import { PublicationCard } from '../../../../../../components/client-components/cards/PublicationCard'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function RelatedPublications({
  params,
}: {
  params: { id: string; version: string }
}) {


  const relatedPubs = await fetchQueryWithHandler(
    trpc.getRelatedPublications.queryOptions({
      advertId: params.id,
    }),
  )

  const filtered = relatedPubs.publications.filter(
    (pub) => !(pub.advertId === params.id && pub.version === params.version),
  )

  if (filtered.length === 0) {
    return null
  }

  const items = filtered.map((pub) => (
    <PublicationCard key={pub.id} publication={pub} />
  ))

  return (
    <Box background="blue100" padding={[4, 5, 6]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={[3, 4]}>
              <Text variant="h3">Tengdar auglýsingar</Text>
              {filtered.length === 1 ? (
                <PublicationCard publication={filtered[0]} />
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
