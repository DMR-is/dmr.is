'use client'

import { ImagePanel } from '@dmr.is/ui/components/ImagePanel/ImagePanel'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Section } from '@dmr.is/ui/components/Section/Section'

export const ApplicationContainer = () => {
  return (
    <Section>
      <Stack space={4}>
        <ImagePanel
          align="right"
          title="Skrá nýtt mál"
          description="Hér er hægt að skrá ný mál hjá Jafnréttisstofu og fylgjast með stöðu þeirra."
          link="#"
          linkText="Opna skráningarkerfi"
          image={{
            src: '/assets/image-with-text-1.svg',
            alt: 'Skrá mál',
          }}
        />
        <ImagePanel
          title="Skýrslur og gögn"
          description="Sækja skýrslur og tölfræðileg gögn um starfsemi stofnunarinnar."
          link="#"
          linkText="Sækja skýrslu"
          image={{
            src: '/assets/image-with-text-2.svg',
            alt: 'Skýrslur',
          }}
        />
      </Stack>
    </Section>
  )
}
