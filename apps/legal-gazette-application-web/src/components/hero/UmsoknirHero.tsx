'use client'

import { Box } from '@dmr.is/ui/components/island-is'

import { CreateApplication } from '../application/CreateApplication'
import { Hero } from './Hero'

export const UmsoknirHero = () => {
  return (
    <Box paddingY={[3, 4, 5, 6]}>
      <Hero
        variant="small"
        title="Lögbirtingablaðið - auglýsingar"
        description="Hér getur þú valið um hverskonar auglýsingu þú vilt senda inn til Lögbirtingablaðsins."
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
