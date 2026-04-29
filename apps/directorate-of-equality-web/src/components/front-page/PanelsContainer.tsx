import { ImagePanel } from '@dmr.is/ui/components/ImagePanel/ImagePanel'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Section } from '@dmr.is/ui/components/Section/Section'

export const PanelsContainer = () => {
  return (
    <Section>
      <Stack space={4}>
        <ImagePanel
          align="right"
          title="Tölulegar upplýsingar"
          description="Upplýsingar birtar opinberlega á vef jafnréttisstofu og fylgst er með árangri ..."
          link="#"
          linkText="Lesa meira"
          image={{
            src: '/assets/tolfraedi-image.svg',
            alt: '',
          }}
        />
        <ImagePanel
          title="Keyra út lista"
          description="Sækja skýrslur og tölfræðileg gögn um starfsemi stofnunarinnar."
          link="#"
          linkText="Sækja skýrslu"
          image={{
            src: '/assets/keyra-ut-lista-image.svg',
            alt: '',
          }}
        />
      </Stack>
    </Section>
  )
}
