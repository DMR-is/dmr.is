'use client'

import Hero from '@dmr.is/ui/components/Hero/Hero'
import { Box, LinkV2, Text } from '@dmr.is/ui/components/island-is'

import { CreateApplication } from '../application/CreateApplication'
import { createUrlFromHost } from 'libs/shared/utils/src/lib/clientUtils'

export const UmsoknirHero = () => {
  const logbirtinUrl = createUrlFromHost(window.location.host, false)

  return (
    <Box paddingY={[3, 4, 5, 6]}>
      <Hero
        variant="small"
        title="Lögbirtingablaðið - auglýsingar"
        description={
          <Text variant="intro">
            Velkomin á nýja síðu fyrir auglýsendur Lögbirtingablaðsins. Hér má
            sjá <br />
            <Text color="blue400" fontWeight="medium" as="span" variant="intro">
              <LinkV2
                href={logbirtinUrl + '/sidur/leidbeiningar'}
                underlineVisibility="always"
                underline="normal"
              >
                leiðbeiningar
              </LinkV2>{' '}
            </Text>
            fyrir alla vefi Lögbirtingablaðsins.
          </Text>
        }
        contentSpan={['12/12', '8/12']}
        imageSpan={['12/12', '3/12']}
        image={{
          src: '/images/banner-small-image.svg',
          alt: 'Skraut mynd',
        }}
      >
        <CreateApplication />
      </Hero>
    </Box>
  )
}
