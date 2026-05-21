import { ImagePanel } from '@dmr.is/ui/components/ImagePanel/ImagePanel'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Section } from '@dmr.is/ui/components/Section/Section'

import { frontPageText } from '../../lib/text'

export const PanelsContainer = () => {
  return (
    <Section>
      <Stack space={4}>
        <ImagePanel
          align="right"
          title={frontPageText.panelStats.title}
          description={frontPageText.panelStats.description}
          link="#"
          linkText={frontPageText.panelStats.linkText}
          image={{
            src: '/assets/tolfraedi-image.svg',
            alt: '',
          }}
        />
        <ImagePanel
          title={frontPageText.panelExport.title}
          description={frontPageText.panelExport.description}
          link="#"
          linkText={frontPageText.panelExport.linkText}
          image={{
            src: '/assets/keyra-ut-lista-image.svg',
            alt: '',
          }}
        />
      </Stack>
    </Section>
  )
}
