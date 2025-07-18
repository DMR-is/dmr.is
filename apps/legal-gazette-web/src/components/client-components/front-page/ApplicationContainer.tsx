'use client'

import { ImagePanel } from '@dmr.is/ui/components/ImagePanel/ImagePanel'
import { Section } from '@dmr.is/ui/components/Section/Section'

import { Stack } from '@island.is/island-ui/core'

export const ApplicationContainer = () => {
  return (
    <Section>
      <Stack space={4}>
        <ImagePanel
          align="right"
          title="Nýskrá auglýsingu"
          description="Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
          link="#"
          linkText="Opna innsendingarkerfi"
          image={{
            src: '/assets/image-with-text-1.svg',
            alt: 'Image alt',
          }}
        />
        <ImagePanel
          title="Prentútgáfa"
          description="Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
          link="#"
          linkText="Sækja prentútgáfu"
          image={{
            src: '/assets/image-with-text-2.svg',
            alt: 'Image alt',
          }}
        />
      </Stack>
    </Section>
  )
}
