'use client'

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

import { PublicationCard } from '../components/client-components/cards/PublicationCard'
import { PublishedPublicationDto } from '../gen/fetch'

interface RelatedPublicationsContainerProps {
  publications: PublishedPublicationDto[]
}

export function RelatedPublicationsContainer({
  publications,
}: RelatedPublicationsContainerProps) {
  if (publications.length === 0) return null

  const items = publications.map((pub) => (
    <PublicationCard key={pub.id} publication={pub} />
  ))

  return (
    <Box background="blue100" padding={[4, 5, 6]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={[3, 4]}>
              <Text variant="h3">Tengdar auglýsingar</Text>
              {publications.length === 1 ? (
                <PublicationCard publication={publications[0]} />
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
