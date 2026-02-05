'use client'

import Hero from '@dmr.is/ui/components/Hero/Hero'
import { Box, LinkV2, Text } from '@dmr.is/ui/components/island-is'

import { CreateApplication } from '../application/CreateApplication'

export const UmsoknirHero = () => {
  return (
    <Box paddingY={[3, 4, 5, 6]}>
      <Hero
        variant="small"
        title="Lögbirtingablaðið - auglýsendur"
        description={
          <Box style={{ maxWidth: '800px' }}>
            <Text variant="intro" as="span">
              Velkomin á nýja síðu fyrir auglýsendur Lögbirtingablaðsins. Hér má
              sjá{' '}
            </Text>
            <LinkV2
              href="https://logbirtingablad.is/sidur/leidbeiningar"
              underline="normal"
              color="blue400"
              newTab
            >
              <Text fontWeight="medium" as="span" variant="intro">
                leiðbeiningar
              </Text>
            </LinkV2>
            <Text variant="intro" as="span">
              {' '}
              fyrir alla vefi Lögbirtingablaðsins.
            </Text>
          </Box>
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
